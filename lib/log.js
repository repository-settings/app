const process = require('process');
const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
  name: 'github-repo-settings',
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res
  }
});
