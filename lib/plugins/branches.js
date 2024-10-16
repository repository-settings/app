const previewHeaders = {
  accept:
    'application/vnd.github.hellcat-preview+json,application/vnd.github.luke-cage-preview+json,application/vnd.github.zzzax-preview+json'
}

export default class Branches {
  constructor (github, repo, settings) {
    this.github = github
    this.repo = repo
    this.branches = settings
  }

  /**
   * Get branch protection rule ID query
   * @type {string}
   */
  getBranchProtectionRuleIdQuery = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        branchProtectionRules(first: 100) {
          nodes {
            id
            pattern
          }
        }
      }
    }
  `

  /**
   * Get team ID query
   * @type {string}
   */
  getTeamIdQuery = `
    query($org: String!, $slug: String!) {
      organization(login: $org) {
        team(slug: $slug) {
          id
        }
      }
    }
  `

  /**
   * Get user ID query
   * @type {string}
   */
  getUserIdQuery = `
    query($login: String!) {
      user(login: $login) {
        id
      }
    }
  `

  /**
   * Update branch protection mutation
   * @type {string}
   */
  updateBranchProtectionMutation = `
    mutation($protectionSettings: UpdateBranchProtectionRuleInput!) {
      updateBranchProtectionRule(input: $protectionSettings) {
        id
        pattern
      }
    }
  `

  /**
   * Delete branch protection mutation
   * @type {string}
   */
  deleteBranchProtectionMutation = `
    mutation($input: DeleteBranchProtectionRuleInput!) {
      deleteBranchProtectionRule(input: $input) {
        clientMutationId
      }
    }
  `

  /**
   * Sync branch protection settings
   * @returns {Promise<Awaited<unknown>[]>}
   */
  sync () {
    return Promise.all(
      this.branches
        .filter(branch => branch.protection !== undefined)
        .map(branch => {
          const params = Object.assign(this.repo, { branch: branch.name })
          if (branch?.name?.includes('*')) {
            if (this.isEmpty(branch.protection)) {
              return this.deleteBranchProtectionGraphQL(this.github, branch)
            } else {
              return this.updateBranchProtectionGraphQL(this.github, this.repo, branch)
            }
          } else {
            if (this.isEmpty(branch.protection)) {
              return this.github.repos.deleteBranchProtection(params)
            } else {
              Object.assign(params, branch.protection, { headers: previewHeaders })
              return this.github.repos.updateBranchProtection(params)
            }
          }
        })
    )
  }

  /**
   * Update branch protection using GraphQL
   * @param github
   * @param repo
   * @param branch
   * @returns {Promise<*>}
   */
  async updateBranchProtectionGraphQL (github, repo, branch) {
    try {
      const ruleId = await this.getBranchProtectionRuleId(github, repo.owner, repo.repo, branch.name)

      if (ruleId) {
        const protection = branch?.protection
        const updateVariables = {
          protectionSettings: {
            allowsDeletions: protection?.allow_deletions ?? false,
            allowsForcePushes: protection?.allow_force_pushes ?? false,
            branchProtectionRuleId: ruleId,
            dismissesStaleReviews: protection?.required_pull_request_reviews?.dismiss_stale_reviews ?? false,
            isAdminEnforced: protection?.enforce_admins ?? false,
            pattern: branch.name,
            requireLastPushApproval: protection?.restrictions?.required_pull_request_reviews ?? false,
            requiredApprovingReviewCount: protection?.required_pull_request_reviews?.required_approving_review_count ?? 0,
            requiredPullRequestReviewCount: protection?.required_pull_request_reviews?.required_approving_review_count ?? 0,
            requiredStatusCheckContexts: protection?.required_status_checks?.contexts ?? [],
            requiresApprovingReviews: protection?.required_pull_request_reviews?.required_approving_review_count > 0 ?? false,
            requiresCodeOwnerReviews: protection?.required_pull_request_reviews?.require_code_owner_reviews ?? false,
            requiresConversationResolution: protection?.required_conversation_resolution ?? false,
            requiresLinearHistory: protection?.required_linear_history ?? false,
            requiresStatusChecks: protection?.required_status_checks !== null && protection?.required_status_checks !== undefined && protection?.required_status_checks?.contexts.length > 0,
            bypassPullRequestActorIds: [], // initialize empty arrays
            bypassForcePushActorIds: [], // initialize empty arrays
            reviewDismissalActorIds: [] // initialize empty arrays
          }
        }

        if (protection?.required_pull_request_reviews?.dismissal_restrictions?.users) {
          for (const user of protection.required_pull_request_reviews.dismissal_restrictions.users) {
            const userId = await this.getUserId(github, user)
            updateVariables.protectionSettings.reviewDismissalActorIds.push(userId)
          }
        }

        if (protection?.required_pull_request_reviews?.dismissal_restrictions?.teams) {
          for (const team of protection.required_pull_request_reviews.dismissal_restrictions.teams) {
            const teamId = await this.getTeamId(github, repo.owner, team)
            updateVariables.protectionSettings.reviewDismissalActorIds.push(teamId)
          }
        }

        if (protection?.restrictions?.users) {
          for (const user of protection.restrictions.users) {
            const userId = await this.getUserId(github, user)
            updateVariables.protectionSettings.bypassForcePushActorIds.push(userId)
          }
        }

        if (protection?.restrictions?.teams) {
          for (const team of protection.restrictions.teams) {
            const teamId = await this.getTeamId(github, repo.owner, team)
            updateVariables.protectionSettings.bypassForcePushActorIds.push(teamId)
          }
        }

        if (protection?.restrictions?.apps) {
          for (const app of protection.restrictions.apps) {
            const appId = await this.getAppId(github, app)
            updateVariables.protectionSettings.bypassForcePushActorIds.push(appId)
          }
        }

        if (protection?.required_pull_request_reviews?.bypass_pull_request_allowances?.users) {
          for (const user of protection.required_pull_request_reviews.bypass_pull_request_allowances.users) {
            const userId = await this.getUserId(github, user)
            updateVariables.protectionSettings.bypassPullRequestActorIds.push(userId)
          }
        }

        if (protection?.required_pull_request_reviews?.bypass_pull_request_allowances?.teams) {
          for (const team of protection.required_pull_request_reviews.bypass_pull_request_allowances.teams) {
            const teamId = await this.getTeamId(github, repo.owner, team)
            updateVariables.protectionSettings.bypassPullRequestActorIds.push(teamId)
          }
        }

        if (protection?.required_pull_request_reviews?.bypass_pull_request_allowances?.apps) {
          for (const app of protection.required_pull_request_reviews.bypass_pull_request_allowances.apps) {
            const appId = await this.getAppId(github, app)
            updateVariables.protectionSettings.bypassPullRequestActorIds.push(appId)
          }
        }

        return await github.graphql(this.updateBranchProtectionMutation, updateVariables)
      }
    } catch (error) {
      console.error('Error updating branch protection:', error)
    }
  }

  /**
   * Check if an object is empty
   * @param maybeEmpty
   * @returns {boolean}
   */
  isEmpty (maybeEmpty) {
    return maybeEmpty === null || Object.keys(maybeEmpty).length === 0
  }

  /**
   * Get the ID of a branch protection rule
   * @param github
   * @param owner
   * @param repo
   * @param pattern
   * @returns {Promise<*|null>}
   */
  async getBranchProtectionRuleId (github, owner, repo, pattern) {
    try {
      const response = await github.graphql(this.getBranchProtectionRuleIdQuery, {
        owner,
        repo,
        pattern
      })

      const branchProtectionRule = response?.repository?.branchProtectionRules?.nodes?.find(
        (rule) => rule.pattern === pattern
      )

      if (branchProtectionRule) {
        return branchProtectionRule.id
      } else {
        console.error('Branch protection rule not found for branch:', pattern)
        return null
      }
    } catch (error) {
      console.error('Error getting branch protection rule ID:', error)
      return null
    }
  }

  /**
   * Delete branch protection using GraphQL
   * @param github
   * @param branch
   * @returns {Promise<*>}
   */
  async deleteBranchProtectionGraphQL (github, branch) {
    try {
      return this.getBranchProtectionRuleId(
        this.github,
        this.repo.owner,
        this.repo.repo,
        branch.name
      ).then(ruleId => {
        if (ruleId) {
          const deleteVariables = {
            input: {
              branchProtectionRuleId: ruleId
            }
          }
          return github.graphql(this.deleteBranchProtectionMutation, deleteVariables)
        }
      })
    } catch (error) {
      console.error('Error deleting branch protection:', error)
    }
  }

  /**
   * Get the ID of a user
   * @param github
   * @param login
   * @returns {Promise<string|null>}
   */
  async getUserId (github, login) {
    try {
      const response = await github.graphql(this.getUserIdQuery, { login })
      return response?.data?.user?.id ?? null
    } catch (error) {
      console.error('Error getting user ID:', error)
      return null
    }
  }

  /**
   * Get the ID of a team
   * @param github
   * @param org
   * @param slug
   * @returns {Promise<string|null>}
   */
  async getTeamId (github, org, slug) {
    try {
      const response = await github.graphql(this.getTeamIdQuery, { org, slug })
      return response?.data?.organization?.team?.id ?? null
    } catch (error) {
      console.error('Error getting team ID:', error)
      return null
    }
  }

  /**
   * Get the ID of an app
   * @param github
   * @param appSlug
   */
  async getAppId (github, appSlug) {
    try {
      const response = await github.apps.getBySlug({
        slug: appSlug
      })
      return response?.id ?? null
    } catch (error) {
      console.error('Error getting app ID:', error)
      return null
    }
  }
}
