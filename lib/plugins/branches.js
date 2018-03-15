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

          if (Object.keys(branch.protection).length === 0) {
            this.github.repos.removeBranchProtection(params)
          } else {
            Object.assign(params, branch.protection)

            this.github.repos.updateBranchProtection(params)
          }
        })
    )
  }
}
