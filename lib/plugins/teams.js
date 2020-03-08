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
    return this.github.teams.addOrUpdateRepoInOrg(this.toParams(attrs))
  }

  add (attrs) {
    return this.github.teams.addOrUpdateRepoInOrg(this.toParams(attrs))
  }

  remove (existing) {
    return this.github.teams.removeRepoInOrg({ team_slug: existing.slug, ...this.repo, org: this.repo.owner })
  }

  toParams (attrs) {
    return {
      team_slug: attrs.name,
      owner: this.repo.owner,
      repo: this.repo.repo,
      org: this.repo.owner,
      permission: attrs.permission
    }
  }
}
