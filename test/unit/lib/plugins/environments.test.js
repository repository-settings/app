import { when } from 'jest-when'
import { jest } from '@jest/globals'
import Environments from '../../../../lib/plugins/environments.js'

describe('Environments', () => {
  let github
  const org = 'bkeepers'
  const repo = 'test'

  function configure (config) {
    return new Environments(github, { owner: org, repo }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn().mockReturnValue(Promise.resolve(true))
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
            custom_branches: ['dev/*', 'dev-*', { name: 'v*', type: 'tag' }]
          }
        },
        {
          name: 'unchanged-environment',
          deployment_branch_policy: {
            custom_branches: ['dev/*', 'dev-*', { name: 'v*', type: 'tag' }, { name: '*.*.*', type: 'tag' }]
          }
        },
        {
          name: 'changed-environment',
          deployment_branch_policy: {
            custom_branches: ['dev/*', { name: '*.*.*', type: 'tag' }]
          }
        },
        {
          name: 'changed-branch-policy',
          deployment_branch_policy: {
            protected_branches: true
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
                name: 'unchanged-environment',
                deployment_branch_policy: {
                  protected_branches: false,
                  custom_branch_policies: true
                }
              },
              {
                name: 'changed-environment',
                deployment_branch_policy: {
                  protected_branches: false,
                  custom_branch_policies: true
                }
              },
              {
                name: 'changed-branch-policy',
                deployment_branch_policy: {
                  protected_branches: false,
                  custom_branch_policies: true
                }
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

      when(github.request)
        .calledWith('GET /repos/:org/:repo/environments/:environment_name/deployment-branch-policies', {
          org,
          repo,
          environment_name: 'changed-branch-policy'
        })
        .mockResolvedValue({
          data: {
            branch_policies: [
              {
                id: 3,
                node_id: '3',
                name: 'v*',
                type: 'tag'
              },
              {
                id: 2,
                node_id: '2',
                name: 'dev-*',
                type: 'branch'
              },
              {
                id: 1,
                node_id: '1',
                name: 'dev/*',
                type: 'branch'
              }
            ]
          }
        })

      when(github.request)
        .calledWith('GET /repos/:org/:repo/environments/:environment_name/deployment-branch-policies', {
          org,
          repo,
          environment_name: 'unchanged-environment'
        })
        .mockResolvedValue({
          data: {
            branch_policies: [
              {
                id: 4,
                node_id: '4',
                name: '*.*.*',
                type: 'tag'
              },
              {
                id: 3,
                node_id: '3',
                name: 'v*',
                type: 'tag'
              },
              {
                id: 2,
                node_id: '2',
                name: 'dev-*',
                type: 'branch'
              },
              {
                id: 1,
                node_id: '1',
                name: 'dev/*',
                type: 'branch'
              }
            ]
          }
        })

      when(github.request)
        .calledWith('GET /repos/:org/:repo/environments/:environment_name/deployment-branch-policies', {
          org,
          repo,
          environment_name: 'changed-environment'
        })
        .mockResolvedValue({
          data: {
            branch_policies: [
              {
                id: 3,
                node_id: '3',
                name: 'v*',
                type: 'tag'
              },
              {
                id: 2,
                node_id: '2',
                name: 'dev-*',
                type: 'branch'
              },
              {
                id: 1,
                node_id: '1',
                name: 'dev/*',
                type: 'branch'
              }
            ]
          }
        })

      return plugin.sync().then(() => {
        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'changed-wait-timer',
          deployment_branch_policy: null,
          wait_timer: 10
        })

        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'changed-reviewers-type',
          deployment_branch_policy: null,
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

        expect(github.request).toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'new-environment',
            name: 'dev/*',
            type: 'branch'
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'new-environment',
            name: 'dev-*',
            type: 'branch'
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'new-environment',
            name: 'v*',
            type: 'tag'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'unchanged-environment',
          deployment_branch_policy: {
            protected_branches: false,
            custom_branch_policies: true
          }
        })

        expect(github.request).not.toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            name: 'dev/*',
            type: 'branch'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            name: 'dev-*',
            type: 'branch'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            name: 'v*',
            type: 'tag'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            name: '*.*.*',
            type: 'tag'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            id: 4
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            id: 3
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            id: 2
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'unchanged-environment',
            id: 1
          }
        )

        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'changed-environment',
          wait_timer: 0,
          deployment_branch_policy: {
            protected_branches: false,
            custom_branch_policies: true
          }
        })

        expect(github.request).toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            name: 'dev/*',
            type: 'branch'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            name: 'dev-*',
            type: 'branch'
          }
        )

        expect(github.request).not.toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            name: 'v*',
            type: 'tag'
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'POST /repos/:org/:repo/environments/:environment_name/deployment-branch-policies',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            name: '*.*.*',
            type: 'tag'
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            id: 3
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            id: 2
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'changed-environment',
            id: 1
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'changed-branch-policy',
            id: 1
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'changed-branch-policy',
            id: 2
          }
        )

        expect(github.request).toHaveBeenCalledWith(
          'DELETE /repos/:org/:repo/environments/:environment_name/deployment-branch-policies/:id',
          {
            org,
            repo,
            environment_name: 'changed-branch-policy',
            id: 3
          }
        )

        expect(github.request).toHaveBeenCalledWith('PUT /repos/:org/:repo/environments/:environment_name', {
          org,
          repo,
          environment_name: 'changed-branch-policy',
          wait_timer: 0,
          deployment_branch_policy: {
            protected_branches: true,
            custom_branch_policies: false
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
