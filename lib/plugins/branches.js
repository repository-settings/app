const previewHeaders = { accept: 'application/vnd.github.hellcat-preview+json,application/vnd.github.luke-cage-preview+json,application/vnd.github.zzzax-preview+json' }

module.exports = class Branches {
  constructor (github, repo, settings) {
    this.github = github
    this.repo = repo
    this.branches = settings
  }

  sync () {
    return Promise.all(
      this.branches
        .filter(branch => branch.protection !== undefined)
        .map((branch) => {
          let params = Object.assign(this.repo, { branch: branch.name })

          if (this.isEmpty(branch.protection)) {
            this.github.repos.removeBranchProtection(params)
          } else {
            Object.assign(
              params,
              this.coerceProtectionOptions(branch.protection),
              { headers: previewHeaders }
            )
            this.github.repos.updateBranchProtection(params)
          }
        })
    )
  }

  isEmpty (maybeEmpty) {
    return (maybeEmpty === null) || Object.keys(maybeEmpty).length === 0
  }

  coerceProtectionOptions (options) {
    if (
      (typeof options.restrictions !== 'undefined') &&
      this.isEmpty(options.restrictions)
    ) {
      options.restrictions = null
    }

    if (
      (typeof options.required_pull_request_reviews === 'object') &&
      (typeof options.required_pull_request_reviews.dismissal_restrictions !== 'undefined') &&
      this.isEmpty(options.required_pull_request_reviews.dismissal_restrictions)
    ) {
      options.required_pull_request_reviews.dismissal_restrictions = {}
    }

    return options
  }
}
