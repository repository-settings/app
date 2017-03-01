const fs = require('fs');
const createHandler = require('github-webhook-handler');
const createIntegration = require('github-integration');
const Server = require('./lib/server.js');
const log = require('./lib/log');

const webhook = createHandler({
  path: '/',
  secret: process.env.WEBHOOK_SECRET || 'development'
});

const integration = createIntegration({
  id: process.env.INTEGRATION_ID,
  cert: process.env.PRIVATE_KEY || fs.readFileSync('private-key.pem'),
  debug: log.level() <= 10
});

// Show trace for any unhandled rejections
process.on('unhandledRejection', reason => {
  log.error(reason);
});

new Server(integration, webhook).start(process.env.PORT || 3000);
