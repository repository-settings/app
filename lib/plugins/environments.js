const Diffable = require('./diffable')

const environmentRepoEndpoint = '/repos/:org/:repo/environments/:environment_name'

module.exports = class Environments extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      // Force all names to lowercase to avoid comparison issues.
      this.entries.forEach(environment => {
        environment.name = environment.name.toLowerCase()
      })
    }
  }

  async find () {
    const {
      data: { environments }
    } = await this.github.request('GET /repos/:org/:repo/environments', {
      org: this.repo.owner,
      repo: this.repo.repo
    })
    return environments.map(environment => {
      return {
        ...environment,
        // Force all names to lowercase to avoid comparison issues.
        name: environment.name.toLowerCase()
      }
    })
  }

  comparator (existing, attrs) {
    return existing.name === attrs.name
  }

  changed (existing, attrs) {
    if (!attrs.wait_timer) attrs.wait_timer = 0
    return (
      (existing.wait_timer || 0) !== attrs.wait_timer ||
      this.reviewersToString(existing.reviewers) !== this.reviewersToString(attrs.reviewers) ||
      this.deploymentBranchPolicyToString(existing.deployment_branch_policy) !==
        this.deploymentBranchPolicyToString(attrs.deployment_branch_policy)
    )
  }

  update (existing, attrs) {
    return this.add(attrs)
  }

  add (attrs) {
    return this.github.request(`PUT ${environmentRepoEndpoint}`, this.toParams({ name: attrs.name }, attrs))
  }

  remove (existing) {
    return this.github.request(`DELETE ${environmentRepoEndpoint}`, {
      environment_name: existing.name,
      repo: this.repo.repo,
      org: this.repo.owner
    })
  }

  reviewersToString (attrs) {
    if (attrs === null || attrs === undefined) {
      return ''
    } else {
      attrs.sort((a, b) => {
        if (a.id < b.id) return -1
        if (a.id > b.id) return 1
        if (a.type < b.type) return -1
        if (a.type > b.type) return 1
        return 0
      })
      return JSON.stringify(
        attrs.map(reviewer => {
          return {
            id: reviewer.id,
            type: reviewer.type
          }
        })
      )
    }
  }

  deploymentBranchPolicyToString (attrs) {
    if (attrs === null || attrs === undefined) {
      return ''
    } else {
      return JSON.stringify({
        custom_branch_policies: attrs.custom_branch_policies,
        protected_branches: attrs.protected_branches
      })
    }
  }

  toParams (existing, attrs) {
    return {
      environment_name: existing.name,
      repo: this.repo.repo,
      org: this.repo.owner,
      wait_timer: attrs.wait_timer,
      reviewers: attrs.reviewers,
      deployment_branch_policy: attrs.deployment_branch_policy
    }
  }
}
