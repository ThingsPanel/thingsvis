import pino from 'pino';
import pretty from 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';
const DEV_LOG_LEVEL = 'debug';
const PROD_LOG_LEVEL = 'info';
const PRETTY_IGNORE_FIELDS = 'pid,hostname';
const PRETTY_TRANSLATE_TIME = 'SYS:standard';

const loggerStream = isDev
  ? pretty({
      colorize: true,
      ignore: PRETTY_IGNORE_FIELDS,
      sync: true,
      translateTime: PRETTY_TRANSLATE_TIME,
    })
  : undefined;

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? DEV_LOG_LEVEL : PROD_LOG_LEVEL),
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  loggerStream,
);
