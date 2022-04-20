const Diffable = require('./diffable')

module.exports = class Milestones extends Diffable {
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
    const options = this.github.issues.listMilestones.endpoint.merge(
      Object.assign({ per_page: 100, state: 'all' }, this.repo)
    )
    return this.github.paginate(options)
  }

  comparator (existing, attrs) {
    return existing.title === attrs.title
  }

  changed (existing, attrs) {
    return existing.description !== attrs.description || existing.state !== attrs.state
  }

  update (existing, attrs) {
    const { owner, repo } = this.repo

    return this.github.issues.updateMilestone(
      Object.assign({ milestone_number: existing.number }, attrs, { owner, repo })
    )
  }

  add (attrs) {
    const { owner, repo } = this.repo

    return this.github.issues.createMilestone(Object.assign({}, attrs, { owner, repo }))
  }

  remove (existing) {
    const { owner, repo } = this.repo

    return this.github.issues.deleteMilestone(Object.assign({ milestone_number: existing.number }, { owner, repo }))
  }
}
