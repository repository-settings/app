const { when } = require('jest-when')
const Environments = require('../../../../lib/plugins/environments')

describe('Environments', () => {
  let github
  const org = 'bkeepers'
  const repo = 'test'

  function configure (config) {
    return new Environments(github, { owner: org, repo }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn()
    }
  })

  describe('sync', () => {
    it('syncs environments', () => {
      const plugin = configure([
        { name: 'changed-wait-timer', wait_timer: 10 },
        {
          name: 'changed-reviewers-type',
          reviewers: [
            { id: 1, type: 'User' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'new-environment',
          wait_timer: 1,
          reviewers: [
            {
              id: 1,
              type: 'Team'
            },
            {
              id: 2,
              type: 'User'
            }
          ],
          deployment_branch_policy: {
            protected_branches: false,
            custom_branch_policies: true
          }
        },
        {
          name: 'unchanged-reviewers-unsorted',
          reviewers: [
            {
              id: 2,
              type: 'User'
            },
            {
              id: 1,
              type: 'Team'
            }
          ]
        },
        { name: 'Different-case', wait_timer: 0 }
      ])

      when(github.request)
        .calledWith('GET /repos/:org/:repo/environments', { org, repo })
        .mockResolvedValue({
          data: {
            environments: [
              { name: 'different-Case', wait_timer: 0 },
              { name: 'changed-wait-timer', wait_timer: 0 },
              {
                name: 'changed-reviewers-type',
                reviewers: [
                  { id: 1, type: 'Team' },
                  { id: 2, type: 'User' }
                ]
              },
              {
                name: 'unchanged-reviewers-unsorted',
                reviewers: [
                  { id: 1, type: 'Team' },
                  { id: 2, type: 'User' }
                ]
              },
              { name: 'deleted', wait_timer: 0 }
            ]
          }
        })

      return plugin.sync().then(() => {
        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'changed-wait-timer',
          wait_timer: 10
        })

        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'changed-reviewers-type',
          wait_timer: 0,
          reviewers: [
            { id: 1, type: 'User' },
            { id: 2, type: 'User' }
          ]
        })

        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'new-environment',
          wait_timer: 1,
          reviewers: [
            {
              id: 1,
              type: 'Team'
            },
            {
              id: 2,
              type: 'User'
            }
          ],
          deployment_branch_policy: {
            protected_branches: false,
            custom_branch_policies: true
          }
        })

        expect(github.request).toHaveBeenCalledWith('DELETE /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'deleted'
        })
      })
    })
  })
})
