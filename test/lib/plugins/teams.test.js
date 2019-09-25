const Teams = require('../../../lib/plugins/teams')

describe('Teams', () => {
  let github

  function configure (config) {
    return new Teams(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      repos: {
        listTeams: jest.fn().mockImplementation(() => Promise.resolve({ data: [
          { id: 1, slug: 'unchanged', permission: 'push' },
          { id: 2, slug: 'removed', permission: 'push' },
          { id: 3, slug: 'updated-permission', permission: 'pull' }
        ] }))
      },
      teams: {
        addOrUpdateRepo: jest.fn().mockImplementation(() => Promise.resolve()),
        list: jest.fn().mockImplementation(() => Promise.resolve({ data: [
          { id: 4, slug: 'added' }
        ] })),
        removeRepo: jest.fn().mockImplementation(() => Promise.resolve())
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
        expect(github.teams.addOrUpdateRepo).toHaveBeenCalledWith({
          org: 'bkeepers',
          repo: 'test',
          id: 3,
          permission: 'admin'
        })

        expect(github.teams.addOrUpdateRepo).toHaveBeenCalledWith({
          org: 'bkeepers',
          repo: 'test',
          id: 4,
          permission: 'pull'
        })

        expect(github.teams.addOrUpdateRepo).toHaveBeenCalledTimes(2)

        expect(github.teams.removeRepo).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          id: 2
        })

        expect(github.teams.removeRepo).toHaveBeenCalledTimes(1)
      })
    })
  })
})
