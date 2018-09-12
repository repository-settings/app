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
            Object.assign(params, branch.protection, { headers: previewHeaders })
            this.github.repos.updateBranchProtection(params)
          }
        })
    )
  }

  isEmpty (maybeEmpty) {
    return (maybeEmpty === null) || Object.keys(maybeEmpty).length === 0
  }
}
