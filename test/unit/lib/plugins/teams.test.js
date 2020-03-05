const Teams = require('../../../../lib/plugins/teams')

describe('Teams', () => {
  let github

  function configure (config) {
    return new Teams(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      paginate: jest.fn().mockImplementation(() => Promise.resolve()),
      repos: {
        listTeams: jest.fn().mockImplementation(() => Promise.resolve({
          data: [
            { id: 1, slug: 'unchanged', permission: 'push' },
            { id: 2, slug: 'removed', permission: 'push' },
            { id: 3, slug: 'updated-permission', permission: 'pull' }
          ]
        }))
      },
      teams: {
        addOrUpdateRepoInOrg: jest.fn().mockImplementation(() => Promise.resolve()),
        removeRepoInOrg: jest.fn().mockImplementation(() => Promise.resolve())
      }
    }
  })

  describe('sync', () => {
    it('syncs teams', () => {
      const plugin = configure([
        { name: 'unchanged', permission: 'push' },
        { name: 'updated-permission', permission: 'admin' },
        { name: 'added', permission: 'pull' }
      ])

      return plugin.sync().then(() => {
        expect(github.teams.addOrUpdateRepoInOrg).toHaveBeenCalledWith({
          org: 'bkeepers',
          owner: 'bkeepers',
          repo: 'test',
          team_slug: 'updated-permission',
          permission: 'admin'
        })

        expect(github.teams.addOrUpdateRepoInOrg).toHaveBeenCalledWith({
          org: 'bkeepers',
          owner: 'bkeepers',
          repo: 'test',
          team_slug: 'added',
          permission: 'pull'
        })

        expect(github.teams.addOrUpdateRepoInOrg).toHaveBeenCalledTimes(2)

        expect(github.teams.removeRepoInOrg).toHaveBeenCalledWith({
          org: 'bkeepers',
          owner: 'bkeepers',
          repo: 'test',
          team_slug: 'removed'
        })

        expect(github.teams.removeRepoInOrg).toHaveBeenCalledTimes(1)
      })
    })
  })
})
