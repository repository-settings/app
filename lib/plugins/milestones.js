const Diffable = require('./diffable')

module.exports = class Milestones extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      this.entries.forEach(milestone => {
        if (milestone.due_on) { milestone.due_on = new Date(milestone.due_on).toISOString().split('.')[0] + 'Z' }
      })
    }
  }

  find () {
    return this.github.issues.getMilestones(Object.assign({ state: 'all' }, this.repo)).then(res => res.data)
  }

  comparator (existing, attrs) {
    return existing.title === attrs.title
  }

  changed (existing, attrs) {
    return existing.description !== attrs.description || existing.state !== attrs.state || existing.due_on !== attrs.due_on
  }

  update (existing, attrs) {
    return this.github.issues.updateMilestone(Object.assign({ number: existing.number }, attrs, this.repo))
  }

  add (attrs) {
    return this.github.issues.createMilestone(Object.assign({}, attrs, this.repo))
  }

  remove (existing) {
    return this.github.issues.deleteMilestone(
      Object.assign({ number: existing.number }, this.repo)
    )
  }
}
