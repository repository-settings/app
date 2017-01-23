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

    if (this.config.labels) {
      return this.github.issues.getLabels(this.repo).then(existingLabels => {
        const changes = [];

        this.config.labels.forEach(newLabel => {
          // Force color to string since some hex colors can be numerical (e.g. 999999)
          newLabel.color = String(newLabel.color);

          const existingLabel = existingLabels.find(label => {
            return label.name === newLabel.name || label.name === newLabel.oldname;
          });
          if (!existingLabel) {
            changes.push(this.github.issues.createLabel(Object.assign({}, newLabel, this.repo)));
          } else if (newLabel.oldname === existingLabel.name || existingLabel.color !== newLabel.color) {
            newLabel.oldname = newLabel.oldname || newLabel.name;
            changes.push(this.github.issues.updateLabel(Object.assign({}, newLabel, this.repo)));
          }
        });

        existingLabels.forEach(existingLabel => {
          const orphaned = !this.config.labels.find(label => {
            return existingLabel.name === label.name || existingLabel.name === label.oldname;
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
    log.debug({repo: this.repo, collaborators: this.config.collaborators}, 'syncing collaborators');

    if (this.config.collaborators) {
      this.config.collaborators.forEach(collaborator => {
        // Force all usernames to lowercase to avoid comparison issues.
        collaborator.username = collaborator.username.toLowerCase();
      });

      return this.github.repos.getCollaborators(this.repo).then(users => {
        const existingCollaborators = users.map(user => {
          return {
            // Force all usernames to lowercase to avoid comparison issues.
            username: user.login.toLowerCase(),
            permission: (user.permissions.admin && 'admin') ||
              (user.permissions.push && 'push') ||
              (user.permissions.pull && 'pull')
          };
        });

        const changes = [];

        this.config.collaborators.forEach(newCollabortor => {
          const existingCollaborator = existingCollaborators.find(collaborator => {
            return collaborator.username === newCollabortor.username;
          });
          if (!existingCollaborator || newCollabortor.permission !== existingCollaborator.permission) {
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

  updateTeams() {
    log.debug({repo: this.repo, teams: this.config.teams}, 'syncing teams');

    if (this.config.teams) {
      return this.github.repos.getTeams(this.repo).then(existingTeams => {
        const changes = [];

        this.config.teams.forEach(newTeam => {
          let existingTeam = existingTeams.find(team => {
            return team.slug === newTeam.name;
          });

          if (!existingTeam) {
            // There is not a way to resolve a team slug to an id without
            // fetching all teams for an organization.
            changes.push(this.github.orgs.getTeams({org: this.repo.owner}).then(teams => {
              // FIXME: handle pagination
              existingTeam = teams.find(team => team.slug === newTeam.name);

              return this.github.orgs.addTeamRepo({
                id: existingTeam.id,
                org: this.repo.owner,
                repo: this.repo.repo,
                permission: newTeam.permission
              });
            }));
          } else if (newTeam.permission !== existingTeam.permission) {
            changes.push(this.github.orgs.addTeamRepo({
              id: existingTeam.id,
              org: this.repo.owner,
              repo: this.repo.repo,
              permission: newTeam.permission
            }));
          }
        });

        existingTeams.forEach(x => {
          if (!this.config.teams.find(y => x.slug === y.name)) {
            changes.push(this.github.orgs.deleteTeamRepo(
              Object.assign({}, {id: x.id}, this.repo)
            ));
          }
        });

        return Promise.all(changes);
      });
    }
  }
}

Configurer.FILE_NAME = '.github/config.yml';

module.exports = Configurer;
