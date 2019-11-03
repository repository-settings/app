const Diffable = require('./diffable')
const previewHeaders = { accept: 'application/vnd.github.symmetra-preview+json' }

module.exports = class Labels extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      this.entries.forEach(label => {
        if (!label.color) {
          // Force a color to be set as this is required by the API
          label.color = Math.floor(Math.random() * 16777215).toString(16)
        }

        // Force color to string since some hex colors can be numerical (e.g. 999999)
        label.color = String(label.color).replace(/^#/, '')
        if (label.color.length < 6) {
          label.color.padStart(6, '0')
        }
      })
    }
  }

  find () {
    const options = this.github.issues.listLabelsForRepo.endpoint.merge(this.wrapAttrs({ per_page: 100 }))
    return this.github.paginate(options)
  }

  comparator (existing, attrs) {
    return existing.name === attrs.name || existing.name === attrs.oldname || existing.name === attrs.current_name
  }

  changed (existing, attrs) {
    return attrs.oldname === existing.name || existing.color !== attrs.color || existing.description !== attrs.description
  }

  update (existing, attrs) {
    // Our settings file uses oldname for renaming labels,
    // however octokit/rest 16.30.1 uses the current_name attribute.
    // Future versions of octokit/rest will need name and new_name attrs.
    attrs.current_name = attrs.oldname || attrs.name
    delete attrs.oldname
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
