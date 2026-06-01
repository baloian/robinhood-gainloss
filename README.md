# Robinhood Gain/Loss Calculator

This TypeScript project parses [Robinhood](https://robinhood.com/) account activity CSV exports and prints monthly realized gain/loss, holdings, dividends, fees, and related metadata. Robinhood monthly statements do not include realized gains and losses; this tool fills that gap.

**IMPORTANT:** This project does **not** generate tax forms. It is a calculator for personal review only.


## Install

```bash
git clone git@github.com:baloian/robinhood-gainloss.git
cd robinhood-gainloss
npm install
```

`npm install` runs `prepare`, which compiles TypeScript to `dist/`.

## Setup

1. In your Robinhood account, download your account activity report as one or more `.csv` files.
2. Create an `input` folder in the project root and place the CSV files there:

```text
robinhood-gainloss/
  input/
    2024-01.csv
    2024-02.csv
```

Only files ending in `.csv` are read. You can use a single file or multiple files; all rows are merged and sorted by process date before calculations run.

## Run

From the project root, using the default `input` directory:

```bash
npm run start
```

Development run (same behavior, `NODE_ENV=development`):

```bash
npm run dev
```

Custom input directory (any path to a folder of CSV files):

```bash
npm run build
node dist/main.js /path/to/your/csv-folder
```

Example:

```bash
node dist/main.js ./input
```

Output is printed to the terminal: per-month buy/sell tables, metadata (dividends, fees, ACH, etc.), open holdings, and short-term vs long-term realized gain/loss by symbol.

## Test

Run the full test suite (compile + Jest):

```bash
npm test
```

Build only (no tests):

```bash
npm run build
```

Format source and tests with Prettier:

```bash
npm run format
```

## Contributions

Contributions are welcome via GitHub pull requests.

## License

This source code is available under the standard [MIT LICENSE](https://github.com/baloian/robinhood-gainloss/blob/master/LICENSE).
