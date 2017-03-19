// NOTE: The APIs needed for this plugin are not supported yet by Integrations
// https://developer.github.com/early-access/integrations/available-endpoints/
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
    // There is not a way to resolve a team slug to an id without fetching all
    // teams for an organization.
    return this.allTeams.then(teams => {
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

  // Lazy getter to fetch all teams for the organization
  get allTeams() {
    const getter = this.github.orgs.getTeams({org: this.repo.owner}).then(this.paginate.bind(this));
    Object.defineProperty(this, 'allTeams', getter);
    return getter;
  }

  // Paginator will keep fetching the next page until there are no more.
  paginate(res, records = []) {
    records = records.concat(res);
    if (res.meta && this.github.hasNextPage(res)) {
      return this.github.getNextPage(res).then(next => {
        return this.paginate(next, records);
      });
    } else {
      return Promise.resolve(records);
    }
  }
};
