require('dotenv').config({silent: true});

const http = require('http');
const log = require('./log');
const Configurer = require('./configurer');

module.exports = class Server {
  constructor(integration, webhook) {
    this.integration = integration;
    this.webhook = webhook;
  }

  start(port) {
    this.webhook.on('push', this.receive.bind(this));
    http.createServer(this.handle.bind(this)).listen(port);
    log.info('Listening on http://localhost:' + port);
  }

  handle(req, res) {
    log.info({req}, 'start request');
    this.webhook(req, res, err => {
      if (err) {
        log.error(err);
        res.statusCode = 500;
        res.end('Something has gone terribly wrong.');
      } else {
        res.statusCode = 404;
        res.end('no such location');
      }
    });
    log.info({res}, 'done response');
  }

  receive(event) {
    log.trace({event}, 'webhook received');

    const payload = event.payload;
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch;

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Configurer.FILE_NAME) ||
        commit.modified.includes(Configurer.FILE_NAME);
    });

    if (defaultBranch && settingsModified) {
      return this.sync(event);
    }
  }

  sync(event) {
    return this.integration.asInstallation(event.payload.installation.id).then(github => {
      const repo = {
        owner: event.payload.repository.owner.name,
        repo: event.payload.repository.name
      };

      return Configurer.sync(github, repo);
    });
  }
};
