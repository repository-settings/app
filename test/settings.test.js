const Settings = require('../lib/settings')

describe('Settings', () => {
  let github = {
    repos: {}
  }

  function configure (yaml) {
    return new Settings(github, {owner: 'bkeepers', repo: 'test'}, yaml)
  }

  describe('update', () => {
    it('syncs teams', () => {
      github.orgs = {}
      github.orgs.deleteTeamRepo = jest.fn().mockImplementation(() => Promise.resolve())
      github.orgs.addTeamRepo = jest.fn().mockImplementation(() => Promise.resolve())
      github.repos.getTeams = jest.fn().mockImplementation(() => Promise.resolve({data: [
        {id: 1, slug: 'unchanged', permission: 'push'},
        {id: 2, slug: 'removed', permission: 'push'},
        {id: 3, slug: 'updated-permission', permission: 'pull'}
      ]}))
      github.orgs.getTeams = jest.fn().mockImplementation(() => Promise.resolve({data: [
        {id: 4, slug: 'added'}
      ]}))

      const config = configure(`
        teams:
          - name: unchanged
            permission: push
          - name: updated-permission
            permission: admin
          - name: added
            permission: pull
      `)

      return config.update().then(() => {
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
