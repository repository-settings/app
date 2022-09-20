const Diffable = require('./diffable')
const previewHeaders = { accept: 'application/vnd.github.symmetra-preview+json' }

module.exports = class Labels extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      this.entries.forEach(label => {
        // Force color to string since some hex colors can be numerical (e.g. 999999)
        if (label.color) {
          label.color = String(label.color).replace(/^#/, '')
          if (label.color.length < 6) {
            label.color = label.color.padStart(6, '0')
          }
        }
      })
    }
  }

  find () {
    const options = this.github.issues.listLabelsForRepo.endpoint.merge(this.wrapAttrs({ per_page: 100 }))
    return this.github.paginate(options)
  }

  comparator (existing, attrs) {
    return existing.name === attrs.name
  }

  changed (existing, attrs) {
    return 'new_name' in attrs || existing.color !== attrs.color || existing.description !== attrs.description
  }

  update (existing, attrs) {
    return this.github.issues.updateLabel(this.wrapAttrs(attrs))
  }

  add (attrs) {
    return this.github.issues.createLabel(this.wrapAttrs(attrs))
  }

  remove (existing) {
    return this.github.issues.deleteLabel(this.wrapAttrs({ name: existing.name }))
  }

  wrapAttrs (attrs) {
    return Object.assign({}, attrs, this.repo, { headers: previewHeaders })
  }
}
