const Branches = require('../../../../lib/plugins/branches')

describe('Branches', () => {
  let github

  function configure (config) {
    return new Branches(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  function standardGraphQLFunction () {
    return (mutation) => {
      if (mutation.includes('updateBranchProtectionRule')) {
        return Promise.resolve('updateBranchProtectionRule')
      }
      if (mutation.includes('deleteBranchProtectionRule')) {
        return Promise.resolve('deleteBranchProtectionRule')
      }
      if (mutation.includes('branchProtectionRules')) {
        return Promise.resolve({
          repository: {
            branchProtectionRules: {
              nodes: [
                {
                  id: 'BRANCHPROTECTIONID=',
                  pattern: 'release/*'
                }
              ]
            }
          }
        })
      }
      if (mutation.includes('query($login: String!)')) {
        return Promise.resolve({
          data: {
            user: {
              id: 'ABC123=='
            }
          }
        })
      }
      if (mutation.includes('query($org: String!, $slug: String!)')) {
        return Promise.resolve({
          data: {
            organization: {
              team: {
                id: 'TEAMID=='
              }
            }
          }
        })
      }

      return Promise.resolve('unknown')
    }
  }

  beforeEach(() => {
    github = {
      repos: {
        updateBranchProtection: jest.fn().mockImplementation(() => Promise.resolve('updateBranchProtection')),
        deleteBranchProtection: jest.fn().mockImplementation(() => Promise.resolve('deleteBranchProtection'))
      },
      apps: {
        getBySlug: jest.fn().mockImplementation(() => Promise.resolve('getBySlug'))
      },
      graphql: jest.fn()
    }
  })

  describe('sync', () => {
    it('syncs branch protection settings', () => {
      const plugin = configure([
        {
          name: 'master',
          protection: {
            required_status_checks: {
              strict: true,
              contexts: ['travis-ci']
            },
            enforce_admins: true,
            required_pull_request_reviews: {
              require_code_owner_reviews: true
            }
          }
        }
      ])

      return plugin.sync().then(() => {
        expect(github.repos.updateBranchProtection).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          branch: 'master',
          required_status_checks: {
            strict: true,
            contexts: ['travis-ci']
          },
          enforce_admins: true,
          required_pull_request_reviews: {
            require_code_owner_reviews: true
          },
          headers: {
            accept:
              'application/vnd.github.hellcat-preview+json,application/vnd.github.luke-cage-preview+json,application/vnd.github.zzzax-preview+json'
          }
        })
      })
    })

    describe('when the "protection" config is empty object', () => {
      it('removes branch protection', () => {
        const plugin = configure([
          {
            name: 'master',
            protection: {}
          }
        ])

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).not.toHaveBeenCalled()
          expect(github.repos.deleteBranchProtection).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            branch: 'master'
          })
        })
      })
    })

    describe('when the "protection" config is set to `null`', () => {
      it('removes branch protection', () => {
        const plugin = configure([
          {
            name: 'master',
            protection: null
          }
        ])

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).not.toHaveBeenCalled()
          expect(github.repos.deleteBranchProtection).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            branch: 'master'
          })
        })
      })
    })

    describe('when the "protection" config is set to an empty array', () => {
      it('removes branch protection', () => {
        const plugin = configure([
          {
            name: 'master',
            protection: []
          }
        ])

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).not.toHaveBeenCalled()
          expect(github.repos.deleteBranchProtection).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            branch: 'master'
          })
        })
      })
    })

    describe('when the "protection" config is set to `false`', () => {
      it('removes branch protection', () => {
        const plugin = configure([
          {
            name: 'master',
            protection: false
          }
        ])

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).not.toHaveBeenCalled()
          expect(github.repos.deleteBranchProtection).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            branch: 'master'
          })
        })
      })
    })

    describe('when the "protection" key is not present', () => {
      it('makes no change to branch protection', () => {
        const plugin = configure([
          {
            name: 'master'
          }
        ])

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).not.toHaveBeenCalled()
          expect(github.repos.deleteBranchProtection).not.toHaveBeenCalled()
        })
      })
    })

    describe('when multiple branches are configured', () => {
      it('updates them each appropriately', () => {
        const plugin = configure([
          {
            name: 'master',
            protection: { enforce_admins: true }
          },
          {
            name: 'other',
            protection: { enforce_admins: false }
          }
        ])

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).toHaveBeenCalledTimes(2)

          expect(github.repos.updateBranchProtection).toHaveBeenLastCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            branch: 'other',
            enforce_admins: false,
            headers: {
              accept:
                'application/vnd.github.hellcat-preview+json,application/vnd.github.luke-cage-preview+json,application/vnd.github.zzzax-preview+json'
            }
          })
        })
      })
    })
  })

  describe('sync for wildcard', () => {
    it('syncs branch protection settings with wildcard', () => {
      github.graphql = jest.fn(standardGraphQLFunction())
      const plugin = configure([
        {
          name: 'release/*',
          protection: {
            required_status_checks: {
              strict: true,
              contexts: ['travis-ci']
            },
            enforce_admins: true,
            required_pull_request_reviews: {
              require_code_owner_reviews: true
            }
          }
        }
      ])
      return plugin.sync().then(() => {
        expect(github.graphql).toHaveBeenCalledWith(expect.any(String), expect.any(Object))
        const [branchProtectionRules] = github.graphql.mock.calls[0]
        expect(branchProtectionRules).toContain('branchProtectionRules')
        const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[1]
        expect(updateBranchProtectionRule).toContain('updateBranchProtectionRule')
        expect(updateBranchProtectionRuleVariables.protectionSettings.allowsDeletions).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
        expect(updateBranchProtectionRuleVariables.protectionSettings.dismissesStaleReviews).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.isAdminEnforced).toBe(true)
        expect(updateBranchProtectionRuleVariables.protectionSettings.pattern).toBe('release/*')
        expect(updateBranchProtectionRuleVariables.protectionSettings.requireLastPushApproval).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiredApprovingReviewCount).toBe(0)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiredPullRequestReviewCount).toBe(0)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiredStatusCheckContexts).toStrictEqual(['travis-ci'])
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresApprovingReviews).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresCodeOwnerReviews).toBe(true)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresConversationResolution).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresLinearHistory).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresStatusChecks).toBe(true)
        expect(updateBranchProtectionRuleVariables.protectionSettings.bypassPullRequestActorIds).toStrictEqual([])
        expect(updateBranchProtectionRuleVariables.protectionSettings.bypassForcePushActorIds).toStrictEqual([])
        expect(updateBranchProtectionRuleVariables.protectionSettings.reviewDismissalActorIds).toStrictEqual([])
      })
    })

    it('syncs branch protection settings with wildcard all args', () => {
      github.graphql = jest.fn(standardGraphQLFunction())
      github.apps.getBySlug = jest.fn().mockImplementation(() => Promise.resolve({
        id: '1234'
      }))
      const plugin = configure([
        {
          name: 'release/*',
          protection: {
            required_status_checks: {
              strict: true,
              contexts: ['travis-ci']
            },
            dismiss_stale_reviews: true,
            require_code_owner_reviews: true,
            required_approving_review_count: 1,
            require_last_push_approval: true,
            enforce_admins: true,
            required_pull_request_reviews: {
              require_code_owner_reviews: true,
              dismissal_restrictions: {
                users: ['user-0'],
                teams: ['team-0']
              },
              bypass_pull_request_allowances: {
                users: ['user-1'],
                teams: ['team-1'],
                apps: ['app-1']
              }
            },
            restrictions: {
              users: ['user-2'],
              teams: ['team-2'],
              apps: ['app-2']
            }
          }
        }
      ])
      return plugin.sync().then(() => {
        expect(github.graphql).toHaveBeenCalledWith(expect.any(String), expect.any(Object))

        const [branchProtectionRules] = github.graphql.mock.calls[0]
        expect(branchProtectionRules).toContain('query($owner: String!, $repo: String!)')

        const [getUserLogin] = github.graphql.mock.calls[1]
        expect(getUserLogin).toContain('query($login: String!)')

        const [getOrg] = github.graphql.mock.calls[2]
        expect(getOrg).toContain('query($org: String!, $slug: String!)')

        const [getUser2] = github.graphql.mock.calls[3]
        expect(getUser2).toContain('query($login: String!)')

        const [getOrg2] = github.graphql.mock.calls[4]
        expect(getOrg2).toContain('query($org: String!, $slug: String!)')

        const [getUser3] = github.graphql.mock.calls[5]
        expect(getUser3).toContain('query($login: String!)')

        const [getOrg3] = github.graphql.mock.calls[6]
        expect(getOrg3).toContain('query($org: String!, $slug: String!)')

        const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[7]
        expect(updateBranchProtectionRule).toContain('updateBranchProtectionRule')

        expect(updateBranchProtectionRuleVariables.protectionSettings.allowsDeletions).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
        expect(updateBranchProtectionRuleVariables.protectionSettings.dismissesStaleReviews).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.isAdminEnforced).toBe(true)
        expect(updateBranchProtectionRuleVariables.protectionSettings.pattern).toBe('release/*')
        expect(updateBranchProtectionRuleVariables.protectionSettings.requireLastPushApproval).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiredApprovingReviewCount).toBe(0)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiredPullRequestReviewCount).toBe(0)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiredStatusCheckContexts).toStrictEqual(['travis-ci'])
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresApprovingReviews).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresCodeOwnerReviews).toBe(true)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresConversationResolution).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresLinearHistory).toBe(false)
        expect(updateBranchProtectionRuleVariables.protectionSettings.requiresStatusChecks).toBe(true)
        expect(updateBranchProtectionRuleVariables.protectionSettings.bypassPullRequestActorIds).toStrictEqual(['ABC123==', 'TEAMID==', '1234'])
        expect(updateBranchProtectionRuleVariables.protectionSettings.bypassForcePushActorIds).toStrictEqual(['ABC123==', 'TEAMID==', '1234'])
        expect(updateBranchProtectionRuleVariables.protectionSettings.reviewDismissalActorIds).toStrictEqual(['ABC123==', 'TEAMID=='])
      })
    })

    describe('when the "protection" config is empty object', () => {
      it('removes branch protection', () => {
        github.graphql = jest.fn((mutation) => {
          if (mutation.includes('deleteBranchProtectionRule')) {
            return Promise.resolve('deleteBranchProtectionRule')
          }
          if (mutation.includes('branchProtectionRules')) {
            return Promise.resolve({
              repository: {
                branchProtectionRules: {
                  nodes: [
                    {
                      id: 'BRANCHPROTECTIONID=',
                      pattern: 'release/*'
                    }
                  ]
                }
              }
            })
          }
        })

        const plugin = configure([
          {
            name: 'release/*',
            protection: {}
          }
        ])

        return plugin.sync().then(() => {
          const [branchProtectionRules, branchProtectionRulesVariables] = github.graphql.mock.calls[0]
          expect(branchProtectionRules).toContain('branchProtectionRules')
          expect(branchProtectionRulesVariables.owner).toBe('bkeepers')
          expect(branchProtectionRulesVariables.repo).toBe('test')
          expect(branchProtectionRulesVariables.pattern).toBe('release/*')

          const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[1]
          expect(updateBranchProtectionRule).toContain('deleteBranchProtectionRule')
          expect(updateBranchProtectionRuleVariables.input.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
        })
      })
    })

    describe('when the "protection" config is set to `null`', () => {
      it('removes branch protection', () => {
        github.graphql = jest.fn((mutation) => {
          if (mutation.includes('deleteBranchProtectionRule')) {
            return Promise.resolve('deleteBranchProtectionRule')
          }
          if (mutation.includes('branchProtectionRules')) {
            return Promise.resolve({
              repository: {
                branchProtectionRules: {
                  nodes: [
                    {
                      id: 'BRANCHPROTECTIONID=',
                      pattern: 'release/*'
                    }
                  ]
                }
              }
            })
          }
        })

        const plugin = configure([
          {
            name: 'release/*',
            protection: null
          }
        ])

        return plugin.sync().then(() => {
          const [branchProtectionRules, branchProtectionRulesVariables] = github.graphql.mock.calls[0]
          expect(branchProtectionRules).toContain('branchProtectionRules')
          expect(branchProtectionRulesVariables.owner).toBe('bkeepers')
          expect(branchProtectionRulesVariables.repo).toBe('test')
          expect(branchProtectionRulesVariables.pattern).toBe('release/*')

          const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[1]
          expect(updateBranchProtectionRule).toContain('deleteBranchProtectionRule')
          expect(updateBranchProtectionRuleVariables.input.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
        })
      })
    })

    describe('when the "protection" config is set to an empty array', () => {
      it('removes branch protection', () => {
        github.graphql = jest.fn((mutation) => {
          if (mutation.includes('deleteBranchProtectionRule')) {
            return Promise.resolve('deleteBranchProtectionRule')
          }
          if (mutation.includes('branchProtectionRules')) {
            return Promise.resolve({
              repository: {
                branchProtectionRules: {
                  nodes: [
                    {
                      id: 'BRANCHPROTECTIONID=',
                      pattern: 'release/*'
                    }
                  ]
                }
              }
            })
          }
        })

        const plugin = configure([
          {
            name: 'release/*',
            protection: []
          }
        ])

        return plugin.sync().then(() => {
          const [branchProtectionRules, branchProtectionRulesVariables] = github.graphql.mock.calls[0]
          expect(branchProtectionRules).toContain('branchProtectionRules')
          expect(branchProtectionRulesVariables.owner).toBe('bkeepers')
          expect(branchProtectionRulesVariables.repo).toBe('test')
          expect(branchProtectionRulesVariables.pattern).toBe('release/*')

          const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[1]
          expect(updateBranchProtectionRule).toContain('deleteBranchProtectionRule')
          expect(updateBranchProtectionRuleVariables.input.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
        })
      })
    })

    describe('when the "protection" config is set to `false`', () => {
      it('removes branch protection', () => {
        github.graphql = jest.fn((mutation) => {
          if (mutation.includes('deleteBranchProtectionRule')) {
            return Promise.resolve('deleteBranchProtectionRule')
          }
          if (mutation.includes('branchProtectionRules')) {
            return Promise.resolve({
              repository: {
                branchProtectionRules: {
                  nodes: [
                    {
                      id: 'BRANCHPROTECTIONID=',
                      pattern: 'release/*'
                    }
                  ]
                }
              }
            })
          }
        })

        const plugin = configure([
          {
            name: 'release/*',
            protection: false
          }
        ])

        return plugin.sync().then(() => {
          const [branchProtectionRules, branchProtectionRulesVariables] = github.graphql.mock.calls[0]
          expect(branchProtectionRules).toContain('branchProtectionRules')
          expect(branchProtectionRulesVariables.owner).toBe('bkeepers')
          expect(branchProtectionRulesVariables.repo).toBe('test')
          expect(branchProtectionRulesVariables.pattern).toBe('release/*')

          const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[1]
          expect(updateBranchProtectionRule).toContain('deleteBranchProtectionRule')
          expect(updateBranchProtectionRuleVariables.input.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
        })
      })
    })

    describe('when the "protection" key is not present', () => {
      it('makes no change to branch protection', () => {
        github.graphql = jest.fn((mutation) => {
          if (mutation.includes('deleteBranchProtectionRule')) {
            return Promise.resolve('deleteBranchProtectionRule')
          }
          if (mutation.includes('branchProtectionRules')) {
            return Promise.resolve({
              repository: {
                branchProtectionRules: {
                  nodes: [
                    {
                      id: 'BRANCHPROTECTIONID=',
                      pattern: 'release/*'
                    }
                  ]
                }
              }
            })
          }
        })
        const plugin = configure([
          {
            name: 'release/*'
          }
        ])

        return plugin.sync().then(() => {
          expect(github.graphql).not.toHaveBeenCalled()
        })
      })
    })

    describe('when multiple branches are configured', () => {
      it('updates them each appropriately', () => {
        const plugin = configure([
          {
            name: 'master',
            protection: { enforce_admins: true }
          },
          {
            name: 'release/*',
            protection: { enforce_admins: false }
          }
        ])

        github.graphql = jest.fn(standardGraphQLFunction())

        return plugin.sync().then(() => {
          expect(github.repos.updateBranchProtection).toHaveBeenCalledTimes(1)

          expect(github.graphql).toHaveBeenCalledWith(expect.any(String), expect.any(Object))

          const [branchProtectionRules] = github.graphql.mock.calls[0]
          expect(branchProtectionRules).toContain('branchProtectionRules')

          const [updateBranchProtectionRule, updateBranchProtectionRuleVariables] = github.graphql.mock.calls[1]
          expect(updateBranchProtectionRule).toContain('updateBranchProtectionRule')

          expect(updateBranchProtectionRuleVariables.protectionSettings.allowsDeletions).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.branchProtectionRuleId).toBe('BRANCHPROTECTIONID=')
          expect(updateBranchProtectionRuleVariables.protectionSettings.dismissesStaleReviews).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.isAdminEnforced).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.pattern).toBe('release/*')
          expect(updateBranchProtectionRuleVariables.protectionSettings.requireLastPushApproval).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiredApprovingReviewCount).toBe(0)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiredPullRequestReviewCount).toBe(0)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiredStatusCheckContexts).toStrictEqual([])
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiresApprovingReviews).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiresCodeOwnerReviews).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiresConversationResolution).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiresLinearHistory).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.requiresStatusChecks).toBe(false)
          expect(updateBranchProtectionRuleVariables.protectionSettings.bypassPullRequestActorIds).toStrictEqual([])
          expect(updateBranchProtectionRuleVariables.protectionSettings.bypassForcePushActorIds).toStrictEqual([])
          expect(updateBranchProtectionRuleVariables.protectionSettings.reviewDismissalActorIds).toStrictEqual([])
        })
      })
    })
  })

  describe('return values', () => {
    it('returns updateBranchProtection Promise', () => {
      const plugin = configure([
        {
          name: 'master',
          protection: { enforce_admins: true }
        }
      ])

      return plugin.sync().then(result => {
        expect(result.length).toBe(1)
        expect(result[0]).toBe('updateBranchProtection')
      })
    })
    it('returns deleteBranchProtection Promise', () => {
      const plugin = configure([
        {
          name: 'master',
          protection: null
        }
      ])

      return plugin.sync().then(result => {
        expect(result.length).toBe(1)
        expect(result[0]).toBe('deleteBranchProtection')
      })
    })
  })

  describe('return values wildcards', () => {
    it('returns updateBranchProtection Promise', () => {
      github.graphql = jest.fn(standardGraphQLFunction())

      const plugin = configure([
        {
          name: 'release/*',
          protection: { enforce_admins: true }
        }
      ])

      return plugin.sync().then(result => {
        expect(result.length).toBe(1)
        expect(result[0]).toBe('updateBranchProtectionRule')
      })
    })
    it('returns deleteBranchProtection Promise', () => {
      github.graphql = jest.fn(standardGraphQLFunction())

      const plugin = configure([
        {
          name: 'release/*',
          protection: null
        }
      ])

      return plugin.sync().then(result => {
        expect(result.length).toBe(1)
        expect(result[0]).toBe('deleteBranchProtectionRule')
      })
    })
    it('returns no Promise', () => {
      github.graphql = jest.fn(standardGraphQLFunction())

      const plugin = configure([
        {
          name: 'release/*'
        }
      ])

      return plugin.sync().then(result => {
        expect(result.length).toBe(0)
      })
    })
  })
})
