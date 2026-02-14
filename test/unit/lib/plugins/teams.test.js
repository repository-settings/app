import { when } from 'jest-when'
import any from '@travi/any'
import Teams from '../../../../lib/plugins/teams'
import { jest } from '@jest/globals'

describe('Teams', () => {
  let github
  const addedTeamName = 'added'
  const addedTeamId = any.integer()
  const updatedTeamName = 'updated-permission'
  const updatedTeamId = any.integer()
  const removedTeamName = 'removed'
  const removedTeamId = any.integer()
  const unchangedTeamName = 'unchanged'
  const unchangedTeamId = any.integer()
  const repoOwner = 'bkeepers'
  const repoName = 'test'

  function configure (config) {
    return new Teams(github, { owner: repoOwner, repo: repoName }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn().mockImplementation(() => Promise.resolve()),
      paginate: jest.fn().mockImplementation(() => Promise.resolve())
    }
  })

  describe('sync', () => {
    it('syncs teams', async () => {
      const plugin = configure([
        { name: unchangedTeamName, permission: 'push' },
        { name: updatedTeamName, permission: 'admin' },
        { name: addedTeamName, permission: 'pull' }
      ])
      when(github.request)
        .calledWith('GET /repos/{owner}/{repo}/teams', { owner: repoOwner, repo: repoName })
        .mockResolvedValue({
          data: [
            { id: unchangedTeamId, slug: unchangedTeamName, permission: 'push' },
            { id: removedTeamId, slug: removedTeamName, permission: 'push' },
            { id: updatedTeamId, slug: updatedTeamName, permission: 'pull' }
          ]
        })
      when(github.request)
        .calledWith('GET /orgs/{org}/teams/{team_slug}', { org: repoOwner, team_slug: addedTeamName })
        .mockResolvedValue({ data: { id: addedTeamId } })

      await plugin.sync()

      expect(github.request).toHaveBeenCalledWith('PUT /teams/{team_id}/repos/{owner}/{repo}', {
        org: repoOwner,
        owner: repoOwner,
        repo: repoName,
        team_id: updatedTeamId,
        permission: 'admin'
      })

      expect(github.request).toHaveBeenCalledWith('PUT /teams/{team_id}/repos/{owner}/{repo}', {
        org: repoOwner,
        owner: repoOwner,
        repo: repoName,
        team_id: addedTeamId,
        permission: 'pull'
      })

      expect(github.request).toHaveBeenCalledWith('DELETE /teams/{team_id}/repos/{owner}/{repo}', {
        org: repoOwner,
        owner: repoOwner,
        repo: repoName,
        team_id: removedTeamId
      })
    })
  })
})
