const Diffable = require('./diffable')
const previewHeaders = { accept: 'application/vnd.github.v3+json' }

module.exports = class Autolinks extends Diffable {
  find () {
    const options = this.github.repos.listAutolinks.endpoint.merge(this.wrapAttrs({ per_page: 100 }))
    return this.github.paginate(options)
  }

  comparator (existing, attrs) {
    return existing.key_prefix === attrs.key_prefix
  }

  changed (existing, attrs) {
    return existing.url_template !== attrs.url_template
  }

  update (existing, attrs) {
    return this.add(attrs)
  }

  add (attrs) {
    return this.github.repos.createAutolink(this.wrapAttrs(attrs))
  }

  remove (existing) {
    return this.github.repos.deleteAutolink(this.wrapAttrs({ autolink_id: existing.id }))
  }

  wrapAttrs (attrs) {
    return Object.assign({}, attrs, this.repo, { headers: previewHeaders })
  }
}
