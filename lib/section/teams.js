const Diffable = require('./diffable');

module.exports = class Teams extends Diffable {
  find() {
    return this.github.repos.getTeams(this.repo);
  }

  comparator(existing, attrs) {
    return existing.slug === attrs.name;
  }

  changed(existing, attrs) {
    return existing.permission !== attrs.permission;
  }

  update(existing, attrs) {
    return this.github.orgs.addTeamRepo(this.toParams(existing, attrs));
  }

  add(attrs) {
    // There is not a way to resolve a team slug to an id without
    // fetching all teams for an organization.
    return this.github.orgs.getTeams({org: this.repo.owner}).then(teams => {
      // FIXME: handle pagination
      const existing = teams.find(team => this.comparator(team, attrs));

      return this.github.orgs.addTeamRepo(this.toParams(existing, attrs));
    });
  }

  remove(existing) {
    return this.github.orgs.deleteTeamRepo(
      Object.assign({id: existing.id}, this.repo)
    );
  }

  toParams(existing, attrs) {
    return {
      id: existing.id,
      org: this.repo.owner,
      repo: this.repo.repo,
      permission: attrs.permission
    };
  }
};
