const yaml = require('js-yaml');
const log = require('./log');
const Teams = require('./section/teams');
const Collaborators = require('./section/collaborators');
const Labels = require('./section/labels');

class Configurer {
  static sync(github, repo) {
    return github.repos.getContent({
      owner: repo.owner,
      repo: repo.repo,
      path: Configurer.FILE_NAME
    }).then(data => {
      const content = new Buffer(data.content, 'base64').toString();
      return new Configurer(github, repo, content).update();
    });
  }

  constructor(github, repo, config) {
    this.github = github;
    this.repo = repo;
    this.config = yaml.load(config);
  }

  update() {
    return Promise.all([
      this.updateRepository(),
      this.updateLabels(),
      this.updateCollaborators(),
      this.updateTeams()
    ]);
  }

  updateRepository() {
    const settings = Object.assign({}, this.config.repository, this.repo);
    settings.name = settings.name || settings.repo;

    log.debug({repo: settings}, 'syncing repository settings');
    return this.github.repos.edit(settings);
  }

  updateLabels() {
    log.debug({repo: this.repo, labels: this.config.labels}, 'syncing labels');
    return new Labels(this.github, this.repo, this.config.labels).sync();
  }

  updateCollaborators() {
    log.debug({repo: this.repo, collaborators: this.config.collaborators}, 'syncing collaborators');
    return new Collaborators(this.github, this.repo, this.config.collaborators).sync();
  }

  updateTeams() {
    log.debug({repo: this.repo, teams: this.config.teams}, 'syncing teams');
    return new Teams(this.github, this.repo, this.config.teams).sync();
  }
}

Configurer.FILE_NAME = '.github/config.yml';

module.exports = Configurer;
