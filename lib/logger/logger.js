import pino from 'pino';
import { __DEV__ } from '../../constants/constants.js';

const devLogger = pino({
  base: undefined,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const prodLogger = pino({
  base: undefined,
  errorKey: 'error',
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets: [
      { target: './stdoutTransport.js' },
      {
        target: './discordTransport.js',
        level: 'error'
      }
    ]
  }
});

export default __DEV__ ? devLogger : prodLogger;
