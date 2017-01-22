const Server = require('./lib/server.js');
const log = require('./lib/log');

// Show trace for any unhandled rejections
process.on('unhandledRejection', reason => {
  log.error(reason);
});

new Server().start();
