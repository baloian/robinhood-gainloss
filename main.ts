import * as path from 'path';
import RobinhoodGainLoss from './src/robinhood-gainloss';

function abort(error?: Error | string, signame: NodeJS.Signals = 'SIGTERM'): never {
  if (error) {
    if (error instanceof Error) {
      console.error('Aborting due to error:', error.message);
      console.error(error.stack);
    } else {
      console.error('Aborting:', error);
    }
  }
  if (typeof process !== 'undefined' && process.kill) {
    process.kill(process.pid, signame);
  }
  throw new Error('Process abort failed');
}

/**
 * This is the main entry point to the entire project.
 * Optional CLI argument: path to directory containing Robinhood CSV exports.
 */
(async () => {
  const inputDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '../input');
  const robinhoodGainLoss = new RobinhoodGainLoss(inputDir);
  await robinhoodGainLoss.run();
})().catch(abort);
