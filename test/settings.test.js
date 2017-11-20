const Settings = require('../lib/settings')

describe('Settings', () => {
  let github

  function configure (yaml) {
    return new Settings(github, {owner: 'bkeepers', repo: 'test'}, yaml)
  }

  beforeEach(() => {
    github = {
      repos: {
        get: jest.fn().mockImplementation(() => Promise.resolve({})),
        edit: jest.fn().mockImplementation(() => Promise.resolve()),
        replaceTopics: jest.fn().mockImplementation(() => Promise.resolve())
      },
      issues: {
        getLabels: jest.fn().mockImplementation(() => Promise.resolve([])),
        createLabel: jest.fn().mockImplementation(() => Promise.resolve()),
        deleteLabel: jest.fn().mockImplementation(() => Promise.resolve()),
        updateLabel: jest.fn().mockImplementation(() => Promise.resolve())
      }
    }
  })

  describe('update', () => {
    it('syncs repository settings', () => {
      const config = configure(`
        repository:
          descripton: Hello World!
      `)
      return config.update().then(() => {
        expect(github.repos.edit).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'test',
          descripton: 'Hello World!'
        })
      })
    })

    it('handles renames', () => {
      const config = configure(`
        repository:
          name: new-name
      `)
      return config.update().then(() => {
        expect(github.repos.edit).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'new-name'
        })
      })
    })

    it('syncs labels', () => {
      github.issues.getLabels.mockReturnValueOnce(Promise.resolve({data: [
        {name: 'no-change', color: 'FF0000'},
        {name: 'new-color', color: '000000'},
        {name: 'update-me', color: '0000FF'},
        {name: 'delete-me', color: '000000'}
      ]}))

      const config = configure(`
        labels:
          - name: no-change
            color: FF0000
          - name: new-name
            oldname: update-me
            color: FFFFFF
          - name: new-color
            color: 999999
          - name: added
      `)

      return config.update().then(() => {
        expect(github.issues.deleteLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'delete-me'
        })

        expect(github.issues.createLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'added'
        })

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'update-me',
          name: 'new-name',
          color: 'FFFFFF'
        })

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'new-color',
          name: 'new-color',
          color: '999999'
        })

        expect(github.issues.deleteLabel).toHaveBeenCalledTimes(1)
        expect(github.issues.updateLabel).toHaveBeenCalledTimes(2)
        expect(github.issues.createLabel).toHaveBeenCalledTimes(1)
      })
    })

    it('syncs collaborators', () => {
      github.repos.getCollaborators = jest.fn().mockImplementation(() => Promise.resolve([]))
      github.repos.removeCollaborator = jest.fn().mockImplementation(() => Promise.resolve())
      github.repos.addCollaborator = jest.fn().mockImplementation(() => Promise.resolve())

      github.repos.getCollaborators.mockReturnValueOnce(Promise.resolve({data: [
        {login: 'bkeepers', permissions: {admin: true, push: true, pull: true}},
        {login: 'updated-permission', permissions: {admin: false, push: false, pull: true}},
        {login: 'removed-user', permissions: {admin: false, push: true, pull: true}},
        {login: 'differentCase', permissions: {admin: false, push: true, pull: true}}
      ]}))

      const config = configure(`
        collaborators:
          - username: bkeepers
            permission: admin
          - username: added-user
            permission: push
          - username: updated-permission
            permission: push
          - username: DIFFERENTcase
            permission: push
      `)

      return config.update().then(() => {
        expect(github.repos.addCollaborator).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          username: 'added-user',
          permission: 'push'
        })

        expect(github.repos.addCollaborator).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          username: 'updated-permission',
          permission: 'push'
        })

        expect(github.repos.addCollaborator).toHaveBeenCalledTimes(2)

        expect(github.repos.removeCollaborator).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          username: 'removed-user'
        })

        expect(github.repos.removeCollaborator).toHaveBeenCalledTimes(1)
      })
    })

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

    it('syncs topics', () => {
      const config = configure(`
        repository:
          topics: foo, bar
      `)

      return config.update().then(() => {
        expect(github.repos.replaceTopics).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          names: ['foo', 'bar']
        })
      })
    })
  })
})
