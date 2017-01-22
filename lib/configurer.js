const yaml = require('js-yaml');
const log = require('./log');

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
      this.updateCollaborators()
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

    if (this.config.labels) {
      return this.github.issues.getLabels(this.repo).then(existingLabels => {
        const changes = [];

        this.config.labels.forEach(newLabel => {
          const existingLabel = existingLabels.find(label => {
            return label.name === newLabel.name || label.name === newLabel.oldName;
          });
          if (!existingLabel) {
            changes.push(this.github.issues.createLabel(Object.assign({}, newLabel, this.repo)));
          } else if (newLabel.oldName === existingLabel.name || existingLabel.color !== newLabel.color) {
            changes.push(this.github.issues.updateLabel(Object.assign({}, newLabel, this.repo)));
          }
        });

        existingLabels.forEach(existingLabel => {
          const orphaned = !this.config.labels.find(label => {
            return existingLabel.name === label.name || existingLabel.name === label.oldName;
          });
          if (orphaned) {
            changes.push(this.github.issues.deleteLabel(
              Object.assign({}, {name: existingLabel.name}, this.repo)
            ));
          }
        });

        return Promise.all(changes);
      });
    }
  }

  updateCollaborators() {
    log.debug({repo: this.repo, labels: this.config.collaborators}, 'syncing collaborators');

    if (this.config.collaborators) {
      return this.github.repos.getCollaborators(this.repo).then(existingCollaborators => {
        const changes = [];

        this.config.collaborators.forEach(newCollabortor => {
          const existingColaborator = existingCollaborators.find(collaborator => {
            return collaborator.username === newCollabortor.username;
          });
          if (!existingColaborator || newCollabortor.permission !== existingColaborator.permission) {
            changes.push(this.github.repos.addCollaborator(Object.assign({}, newCollabortor, this.repo)));
          }
        });

        existingCollaborators.forEach(x => {
          if (!this.config.collaborators.find(y => x.username === y.username)) {
            changes.push(this.github.repos.removeCollaborator(
              Object.assign({}, {username: x.username}, this.repo)
            ));
          }
        });

        return Promise.all(changes);
      });
    }
  }
}

Configurer.FILE_NAME = '.github/settings.yml';

module.exports = Configurer;
