import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { HoodTradeTy } from '../types';
import {
  convertToNumber,
  sortCsvFilesByNumericName,
  sortTradesByProcessDate,
  validateHoodTrade
} from './utils';

export default class Parser {
  static async parseCSV(filePath: string): Promise<HoodTradeTy[]> {
    return new Promise((resolve, reject) => {
      const results: HoodTradeTy[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          const row: HoodTradeTy = {
            activity_date: data['Activity Date'],
            process_date: data['Process Date'],
            settle_date: data['Settle Date'],
            symbol: data['Instrument'],
            description: data['Description'],
            trans_code: data['Trans Code'],
            quantity: convertToNumber(data['Quantity'] || ''),
            price: convertToNumber(data['Price'] || ''),
            amount: convertToNumber(data['Amount'] || '')
          };
          if (!row.process_date) return;
          try {
            validateHoodTrade(row, filePath);
          } catch (err) {
            reject(err);
            return;
          }
          results.push(row);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }

  static async getRawData(dirPath: string): Promise<HoodTradeTy[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const csvFilePaths = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.csv'))
      .map((entry) => path.join(dirPath, entry.name));
    const csvFiles = sortCsvFilesByNumericName(csvFilePaths);

    if (csvFiles.length === 0) {
      throw new Error(`No CSV files found in ${dirPath}`);
    }

    const allRows: HoodTradeTy[] = [];
    for (const filePath of csvFiles) {
      allRows.push(...(await Parser.parseCSV(filePath)));
    }
    return sortTradesByProcessDate(allRows);
  }
}
