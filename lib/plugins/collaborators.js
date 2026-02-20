import Diffable from './diffable.js'

export default class Collaborators extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      // Force all usernames to lowercase to avoid comparison issues.
      this.entries.forEach(collaborator => {
        collaborator.username = collaborator.username.toLowerCase()
      })
    }
  }

  async find () {
    const { data: collaborators } = await this.github.request('GET /repos/{owner}/{repo}/collaborators', {
      repo: this.repo.repo,
      owner: this.repo.owner,
      affiliation: 'direct'
    })

    return collaborators.map(collaborator => ({
      // Force all usernames to lowercase to avoid comparison issues.
      username: collaborator.login.toLowerCase(),
      permission:
        (collaborator.permissions.admin && 'admin') ||
        (collaborator.permissions.push && 'push') ||
        (collaborator.permissions.pull && 'pull')
    }))
  }

  comparator (existing, attrs) {
    return existing.username === attrs.username
  }

  changed (existing, attrs) {
    return existing.permission !== attrs.permission
  }

  update (existing, attrs) {
    return this.add(attrs)
  }

  add (attrs) {
    return this.github.request('PUT /repos/{owner}/{repo}/collaborators/{username}', { ...attrs, ...this.repo })
  }

  remove (existing) {
    return this.github.request('DELETE /repos/{owner}/{repo}/collaborators/{username}', {
      username: existing.username,
      ...this.repo
    })
  }
}
