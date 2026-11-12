import Diffable from './diffable.js'
import findTeam from '../findTeam.js'

// it is necessary to use this endpoint until GitHub Enterprise supports
// the modern version under /orgs
const teamRepoEndpoint = '/teams/{team_id}/repos/{owner}/{repo}'

export default class Teams extends Diffable {
  find () {
    return this.github.request('GET /repos/{owner}/{repo}/teams', this.repo).then(res => res.data)
  }

  comparator (existing, attrs) {
    return existing.slug === attrs.name
  }

  changed (existing, attrs) {
    return existing.permission !== attrs.permission
  }

  update (existing, attrs) {
    return this.github.request(`PUT ${teamRepoEndpoint}`, this.toParams(existing, attrs))
  }

  async add (attrs) {
    const existing = await findTeam(this.github, this.repo.owner, attrs.name)

    return this.github.request(`PUT ${teamRepoEndpoint}`, this.toParams(existing, attrs))
  }

  remove (existing) {
    return this.github.request(`DELETE ${teamRepoEndpoint}`, {
      team_id: existing.id,
      ...this.repo,
      org: this.repo.owner
    })
  }

  toParams (existing, attrs) {
    return {
      team_id: existing.id,
      owner: this.repo.owner,
      repo: this.repo.repo,
      org: this.repo.owner,
      permission: attrs.permission
    }
  }
}
