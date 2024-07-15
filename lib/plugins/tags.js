const Diffable = require('./diffable')

module.exports = class Tags extends Diffable {
  async find () {
    return this.github.repos.listTagProtection(this.repo).then(res => res.data)
  }

  comparator (existing, attrs) {
    return existing.pattern === attrs.pattern
  }

  changed (existing, attrs) {
    return existing.pattern !== attrs.pattern
  }

  async update (existing, attrs) {
    const { owner, repo } = this.repo

    this.github.issues.deleteTagProtection(Object.assign({ tag_protection_id: existing.id }, attrs, { owner, repo }))
    return this.github.repos.createTagProtection(Object.assign({ pattern: attrs.pattern }, attrs, { owner, repo }))
  }

  add (attrs) {
    const { owner, repo } = this.repo
    return this.github.repos.createTagProtection(Object.assign({ pattern: attrs.pattern }, attrs, { owner, repo }))
  }

  remove (existing) {
    const { owner, repo } = this.repo
    return this.github.repos.deleteTagProtection(
      Object.assign({ tag_protection_id: existing.id }, existing, { owner, repo })
    )
  }
}
