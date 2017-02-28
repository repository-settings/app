const fs = require('fs');
const createIntegration = require('github-integration');
const Server = require('./lib/server.js');
const log = require('./lib/log');

const integration = createIntegration({
  id: process.env.INTEGRATION_ID,
  cert: process.env.PRIVATE_KEY || fs.readFileSync('private-key.pem'),
  debug: log.level() <= 10
});

// Show trace for any unhandled rejections
process.on('unhandledRejection', reason => {
  log.error(reason);
});

new Server(integration).start();
