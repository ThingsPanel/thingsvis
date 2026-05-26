import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const DEV_LOG_LEVEL = 'debug';
const PROD_LOG_LEVEL = 'info';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? DEV_LOG_LEVEL : PROD_LOG_LEVEL),
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
});
