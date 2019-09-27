const Repository = require('../../../lib/plugins/repository')

describe('Repository', () => {
  let github

  function configure (config) {
    return new Repository(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      repos: {
        get: jest.fn().mockImplementation(() => Promise.resolve({})),
        update: jest.fn().mockImplementation(() => Promise.resolve()),
        replaceTopics: jest.fn().mockImplementation(() => Promise.resolve())
      }
    }
  })

  describe('sync', () => {
    it('syncs repository settings', () => {
      const plugin = configure({
        name: 'test',
        description: 'Hello World!'
      })
      return plugin.sync().then(() => {
        expect(github.repos.update).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'test',
          description: 'Hello World!'
        })
      })
    })

    it('handles renames', () => {
      const plugin = configure({
        name: 'new-name'
      })
      return plugin.sync().then(() => {
        expect(github.repos.update).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'new-name'
        })
      })
    })

    it('syncs topics', () => {
      const plugin = configure({
        topics: 'foo, bar'
      })

      return plugin.sync().then(() => {
        expect(github.repos.replaceTopics).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          names: ['foo', 'bar'],
          mediaType: {
            previews: ['mercy']
          }
        })
      })
    })
  })
})
