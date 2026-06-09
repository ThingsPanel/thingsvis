import pino from 'pino';

const DEV_LOG_LEVEL = 'debug';
const PROD_LOG_LEVEL = 'info';
const isDev = process.env.NODE_ENV !== 'production';

const logLevel = process.env.LOG_LEVEL || (isDev ? DEV_LOG_LEVEL : PROD_LOG_LEVEL);

const loggerOptions: pino.LoggerOptions = {
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'thingsvis-server',
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
};

if (isDev) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname,service',
      singleLine: true,
    },
  };
}

export const logger = pino(loggerOptions);
