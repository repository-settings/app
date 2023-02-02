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
    return Promise.all(
      environments.map(async environment => {
        if (environment.deployment_branch_policy) {
          if (environment.deployment_branch_policy.custom_branch_policies) {
            const branchPolicies = await this.getDeploymentBranchPolicies(
              this.repo.owner,
              this.repo.repo,
              environment.name
            )
            environment.deployment_branch_policy = {
              custom_branches: branchPolicies.map(_ => _.name)
            }
          } else {
            environment.deployment_branch_policy = {
              protected_branches: true
            }
          }
        }
        return {
          ...environment,
          // Force all names to lowercase to avoid comparison issues.
          name: environment.name.toLowerCase()
        }
      })
    )
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

  async update (existing, attrs) {
    if (existing.deployment_branch_policy && existing.deployment_branch_policy.custom_branches) {
      const branchPolicies = await this.getDeploymentBranchPolicies(this.repo.owner, this.repo.repo, existing.name)
      await Promise.all(
        branchPolicies.map(branchPolicy =>
          this.github.request(
            'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
            {
              org: this.repo.owner,
              repo: this.repo.repo,
              environment_name: existing.name,
              id: branchPolicy.id
            }
          )
        )
      )
    }
    return this.add(attrs)
  }

  async add (attrs) {
    await this.github.request(`PUT ${environmentRepoEndpoint}`, this.toParams({ name: attrs.name }, attrs))
    if (attrs.deployment_branch_policy && attrs.deployment_branch_policy.custom_branches) {
      await Promise.all(
        attrs.deployment_branch_policy.custom_branches.map(name =>
          this.github.request(`POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies`, {
            org: this.repo.owner,
            repo: this.repo.repo,
            environment_name: attrs.name,
            name
          })
        )
      )
    }
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
      return JSON.stringify(
        this.shouldUseProtectedBranches(attrs.protected_branches, attrs.custom_branches)
          ? { protected_branches: true }
          : { custom_branches: attrs.custom_branches.sort() }
      )
    }
  }

  async getDeploymentBranchPolicies (owner, repo, environmentName) {
    const {
      data: { branch_policies: branchPolicies }
    } = await this.github.request('GET /repos/:org/:repo/environments/:environment_name/deployment-branch-policies', {
      org: owner,
      repo,
      environment_name: environmentName
    })
    return branchPolicies
  }

  toParams (existing, attrs) {
    const deploymentBranchPolicy = attrs.deployment_branch_policy
      ? this.shouldUseProtectedBranches(
          attrs.deployment_branch_policy.protected_branches,
          attrs.deployment_branch_policy.custom_branches
        )
        ? { protected_branches: true, custom_branch_policies: false }
        : { protected_branches: false, custom_branch_policies: true }
      : null
    return {
      environment_name: existing.name,
      repo: this.repo.repo,
      org: this.repo.owner,
      wait_timer: attrs.wait_timer,
      reviewers: attrs.reviewers,
      deployment_branch_policy: deploymentBranchPolicy
    }
  }

  shouldUseProtectedBranches (protectedBranches, customBranchPolicies) {
    if (protectedBranches || customBranchPolicies === undefined || customBranchPolicies === null) {
      return true // Returning booleans like this to avoid unexpected datatypes that result in truthy values
    } else {
      return false
    }
  }
}
