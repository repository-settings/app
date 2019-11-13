// NOTE: The APIs needed for this plugin are not supported yet by GitHub Apps
// https://developer.github.com/v3/apps/available-endpoints/
const Diffable = require('./diffable')

module.exports = class Teams extends Diffable {
  find () {
    return this.github.repos.listTeams(this.repo).then(res => res.data)
  }

  comparator (existing, attrs) {
    return existing.slug === attrs.name
  }

  changed (existing, attrs) {
    return existing.permission !== attrs.permission
  }

  update (existing, attrs) {
    return this.github.teams.addOrUpdateRepo(this.toParams(existing, attrs))
  }

  add (attrs) {
    // There is not a way to resolve a team slug to an id without fetching all
    // teams for an organization.
    const options = this.github.teams.list.endpoint.merge({ per_page: 100, org: this.repo.owner })
    this.github.paginate(options).then(teams => {
      const existing = teams.find(team => this.comparator(team, attrs))

      return this.github.teams.addOrUpdateRepo(this.toParams(existing, attrs))
    })
  }

  remove (existing) {
    return this.github.teams.removeRepo({ team_id: existing.id, ...this.repo })
  }

  toParams (existing, attrs) {
    return {
      team_id: existing.id,
      owner: this.repo.owner,
      repo: this.repo.repo,
      permission: attrs.permission
    }
  }
}
