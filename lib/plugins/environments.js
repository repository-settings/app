import Diffable from './diffable.js'

const environmentRepoEndpoint = '/repos/:org/:repo/environments/:environment_name'

function shouldUseProtectedBranches (protectedBranches, customBranchPolicies) {
  return !!(protectedBranches || customBranchPolicies === undefined || customBranchPolicies === null)
}

function attributeSorter (a, b) {
  if (a.id < b.id) return -1
  if (a.id > b.id) return 1
  if (a.type < b.type) return -1
  if (a.type > b.type) return 1
  return 0
}

function reviewersToString (reviewers) {
  if (reviewers === null || reviewers === undefined) {
    return ''
  } else {
    reviewers.sort(attributeSorter)

    return JSON.stringify(
      reviewers.map(reviewer => {
        return {
          id: reviewer.id,
          type: reviewer.type
        }
      })
    )
  }
}

function deploymentBranchPolicyToString (attrs) {
  if (attrs === null || attrs === undefined) {
    return ''
  } else {
    return JSON.stringify(
      shouldUseProtectedBranches(attrs.protected_branches, attrs.custom_branches)
        ? { protected_branches: true }
        : {
            custom_branches: attrs.custom_branches.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
          }
    )
  }
}

function waitTimerHasChanged (existing, attrs) {
  return (existing.wait_timer || 0) !== attrs.wait_timer
}

function reviewersHasChanged (existing, attrs) {
  return reviewersToString(existing.reviewers) !== reviewersToString(attrs.reviewers)
}

function deploymentBranchPolicyHasChanged (existing, attrs) {
  return (
    deploymentBranchPolicyToString(existing.deployment_branch_policy) !==
    deploymentBranchPolicyToString(attrs.deployment_branch_policy)
  )
}

export default class Environments extends Diffable {
  constructor (...args) {
    super(...args)

    if (this.entries) {
      // Force all names to lowercase to avoid comparison issues.
      this.entries.forEach(environment => {
        environment.name = environment.name.toLowerCase()
        if (environment.deployment_branch_policy && environment.deployment_branch_policy.custom_branches) {
          environment.deployment_branch_policy.custom_branches = environment.deployment_branch_policy.custom_branches.map(
            rule => ({
              name: rule.name || rule,
              type: rule.type || 'branch'
            })
          )
        }
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
              custom_branches: branchPolicies.map(_ => ({
                name: _.name,
                type: _.type
              }))
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
      waitTimerHasChanged(existing, attrs) ||
      reviewersHasChanged(existing, attrs) ||
      deploymentBranchPolicyHasChanged(existing, attrs)
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
        attrs.deployment_branch_policy.custom_branches.map(rule =>
          this.github.request('POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies', {
            org: this.repo.owner,
            repo: this.repo.repo,
            environment_name: attrs.name,
            name: rule.name,
            type: rule.type
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
      ? shouldUseProtectedBranches(
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
}
