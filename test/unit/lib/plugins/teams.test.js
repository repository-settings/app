const { when } = require('jest-when')
const any = require('@travi/any')
const Teams = require('../../../../lib/plugins/teams')

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
  const org = 'bkeepers'

  function configure (config) {
    return new Teams(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      paginate: jest.fn().mockImplementation(() => Promise.resolve()),
      repos: {
        listTeams: jest.fn().mockImplementation(() =>
          Promise.resolve({
            data: [
              { id: unchangedTeamId, slug: unchangedTeamName, permission: 'push' },
              { id: removedTeamId, slug: removedTeamName, permission: 'push' },
              { id: updatedTeamId, slug: updatedTeamName, permission: 'pull' }
            ]
          })
        )
      },
      request: jest.fn()
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
        .calledWith('GET /orgs/:org/teams/:team_slug', { org, team_slug: addedTeamName })
        .mockResolvedValue({ data: { id: addedTeamId } })

      await plugin.sync()

      expect(github.request).toHaveBeenCalledWith('PUT /teams/:team_id/repos/:owner/:repo', {
        org,
        owner: org,
        repo: 'test',
        team_id: updatedTeamId,
        permission: 'admin'
      })

      expect(github.request).toHaveBeenCalledWith('PUT /teams/:team_id/repos/:owner/:repo', {
        org,
        owner: org,
        repo: 'test',
        team_id: addedTeamId,
        permission: 'pull'
      })

      expect(github.request).toHaveBeenCalledWith('DELETE /teams/:team_id/repos/:owner/:repo', {
        org,
        owner: org,
        repo: 'test',
        team_id: removedTeamId
      })
    })
  })
})
