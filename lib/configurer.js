const yaml = require('js-yaml');

module.exports = class Configurer {
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
    return this.github.repos.edit(Object.assign({}, this.config.repository, this.repo));
  }

  updateLabels() {
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

};
