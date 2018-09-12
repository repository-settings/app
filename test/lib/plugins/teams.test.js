const Teams = require('../../../lib/plugins/teams')

describe('Teams', () => {
  let github

  function configure (config) {
    return new Teams(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      orgs: {
        deleteTeamRepo: jest.fn().mockImplementation(() => Promise.resolve()),
        addTeamRepo: jest.fn().mockImplementation(() => Promise.resolve()),
        getTeams: jest.fn().mockImplementation(() => Promise.resolve({ data: [
          { id: 4, slug: 'added' }
        ] }))
      },
      repos: {
        getTeams: jest.fn().mockImplementation(() => Promise.resolve({ data: [
          { id: 1, slug: 'unchanged', permission: 'push' },
          { id: 2, slug: 'removed', permission: 'push' },
          { id: 3, slug: 'updated-permission', permission: 'pull' }
        ] }))
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
        expect(github.orgs.addTeamRepo).toHaveBeenCalledWith({
          org: 'bkeepers',
          repo: 'test',
          id: 3,
          permission: 'admin'
        })

        expect(github.orgs.addTeamRepo).toHaveBeenCalledWith({
          org: 'bkeepers',
          repo: 'test',
          id: 4,
          permission: 'pull'
        })

        expect(github.orgs.addTeamRepo).toHaveBeenCalledTimes(2)

        expect(github.orgs.deleteTeamRepo).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          id: 2
        })

        expect(github.orgs.deleteTeamRepo).toHaveBeenCalledTimes(1)
      })
    })
  })
})
