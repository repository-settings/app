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

  async find () {
    const res = await this.github.issues.listMilestonesForRepo(Object.assign({ state: 'all' }, this.repo))
    return res.data
  }

  comparator (existing, attrs) {
    return existing.title === attrs.title
  }

  changed (existing, attrs) {
    return existing.description !== attrs.description || existing.state !== attrs.state
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
