const Diffable = require('./diffable')

module.exports = class Milestones extends Diffable {
  constructor(...args) {
    super(...args)

  }

  find() {
    return this.github.issues.getMilestones(this.repo).then(res => res.data)
  }

  comparator(existing, attrs) {
    return existing.title === attrs.title
  }

  changed(existing, attrs) {
    return existing.description !== attrs.description || existing.due_on !== attrs.due_on
  }

  update(existing, attrs) {
    return this.github.issues.updateMilestone(Object.assign({}, attrs, this.repo, { number: existing.number }))
  }

  add(attrs) {
    return this.github.issues.createMilestone(Object.assign({}, attrs, this.repo))
  }

  remove(existing) {
    return this.github.issues.deleteMilestone(
      Object.assign({}, { number: existing.number }, this.repo)
    )
  }
}
