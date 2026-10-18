import Diffable from './diffable.js'

// the autolinks API defaults `is_alphanumeric` to `true` when it is not provided
const ALPHANUMERIC_DEFAULT = true

function isAlphanumeric (attrs) {
  return attrs.is_alphanumeric === undefined || attrs.is_alphanumeric === null
    ? ALPHANUMERIC_DEFAULT
    : attrs.is_alphanumeric
}

export default class Autolinks extends Diffable {
  find () {
    return this.github.paginate('GET /repos/{owner}/{repo}/autolinks', { per_page: 100, ...this.repo })
  }

  comparator (existing, attrs) {
    return existing.key_prefix === attrs.key_prefix
  }

  changed (existing, attrs) {
    return existing.url_template !== attrs.url_template || isAlphanumeric(existing) !== isAlphanumeric(attrs)
  }

  // the autolinks API provides no update endpoint, so a modified autolink has to be replaced
  update (existing, attrs) {
    return this.remove(existing).then(() => this.add(attrs))
  }

  add (attrs) {
    const { owner, repo } = this.repo

    return this.github.request('POST /repos/{owner}/{repo}/autolinks', {
      ...attrs,
      owner,
      repo
    })
  }

  remove (existing) {
    const { owner, repo } = this.repo

    return this.github.request('DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}', {
      autolink_id: existing.id,
      owner,
      repo
    })
  }
}
