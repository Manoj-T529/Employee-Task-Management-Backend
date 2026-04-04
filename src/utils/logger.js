const winston = require('winston');
const httpContext = require('express-http-context');

const injectRequestId = winston.format((info) => {
  const reqId = httpContext.get('reqId');
  if (reqId) info.reqId = reqId;
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    injectRequestId(),            // Automatically adds reqId to every log
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;