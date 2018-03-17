const Diffable = require('./diffable')

module.exports = class Milestones extends Diffable {
  find () {
    let allMilestones = []

    allMilestones.push(this.github.issues.getMilestones(Object.assign({}, {state: 'open'}, this.repo)).then(res => res.data))
    allMilestones.push(this.github.issues.getMilestones(Object.assign({}, {state: 'closed'}, this.repo)).then(res => res.data))

    return Promise.all(allMilestones)
      .then(milestones => {
        return milestones[0].concat(milestones[1])
      })
  }

  comparator (existing, attrs) {
    return existing.title === attrs.title
  }

  changed (existing, attrs) {
    return existing.description !== attrs.description || existing.due_on !== attrs.due_on
  }

  update (existing, attrs) {
    return this.github.issues.updateMilestone(Object.assign({}, attrs, this.repo, { number: existing.number }))
  }

  add (attrs) {
    return this.github.issues.createMilestone(Object.assign({}, attrs, this.repo))
  }

  remove (existing) {
    return this.github.issues.deleteMilestone(
      Object.assign({}, { number: existing.number }, this.repo)
    )
  }
}
