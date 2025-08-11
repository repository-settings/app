import Diffable from './diffable.js'

export default class Milestones extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      this.entries.forEach(milestone => {
        if (milestone.due_on) {
          delete milestone.due_on
        }
      })
    }
  }

  find () {
    return this.github.paginate('GET /repos/{owner}/{repo}/milestones', { per_page: 100, state: 'all', ...this.repo })
  }

  comparator (existing, attrs) {
    return existing.title === attrs.title
  }

  changed (existing, attrs) {
    return existing.description !== attrs.description || existing.state !== attrs.state
  }

  update (existing, attrs) {
    const { owner, repo } = this.repo

    return this.github.request('PATCH /repos/{owner}/{repo}/milestones/{milestone_number}', {
      milestone_number: existing.number,
      ...attrs,
      owner,
      repo
    })
  }

  add (attrs) {
    const { owner, repo } = this.repo

    return this.github.request('POST /repos/{owner}/{repo}/milestones', {
      ...attrs,
      owner,
      repo
    })
  }

  remove (existing) {
    const { owner, repo } = this.repo

    return this.github.request('DELETE /repos/{owner}/{repo}/milestones/{milestone_number}', {
      milestone_number: existing.number,
      owner,
      repo
    })
  }
}
