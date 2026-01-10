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
 */
(async () => {
  const robinhoodGainLoss = new RobinhoodGainLoss();
  await robinhoodGainLoss.run();
})().catch(abort);
