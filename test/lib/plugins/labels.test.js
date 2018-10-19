const Labels = require('../../../lib/plugins/labels')

describe('Labels', () => {
  let github

  function configure (config) {
    return new Labels(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      issues: {
        getLabels: jest.fn().mockImplementation(() => Promise.resolve([])),
        createLabel: jest.fn().mockImplementation(() => Promise.resolve()),
        deleteLabel: jest.fn().mockImplementation(() => Promise.resolve()),
        updateLabel: jest.fn().mockImplementation(() => Promise.resolve())
      }
    }
  })

  describe('sync', () => {
    it('syncs labels', () => {
      github.issues.getLabels.mockReturnValueOnce(Promise.resolve({ data: [
        { name: 'no-change', color: 'FF0000', description: '' },
        { name: 'new-color', color: 0, description: '' }, // YAML treats `color: 000000` as an integer
        { name: 'new-description', color: '000000', description: '' },
        { name: 'update-me', color: '0000FF', description: '' },
        { name: 'delete-me', color: '000000', description: '' }
      ] }))

      const plugin = configure([
        { name: 'no-change', color: 'FF0000', description: '' },
        { name: 'new-name', oldname: 'update-me', color: 'FFFFFF', description: '' },
        { name: 'new-color', color: '999999', description: '' },
        { name: 'new-description', color: '000000', description: 'Hello world' },
        { name: 'added' }
      ])

      return plugin.sync().then(() => {
        expect(github.issues.deleteLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'delete-me',
          headers: { accept: 'application/vnd.github.symmetra-preview+json' }
        })

        expect(github.issues.createLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'added',
          headers: { accept: 'application/vnd.github.symmetra-preview+json' }
        })

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'update-me',
          name: 'new-name',
          color: 'FFFFFF',
          description: '',
          headers: { accept: 'application/vnd.github.symmetra-preview+json' }
        })

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'new-color',
          name: 'new-color',
          color: '999999',
          description: '',
          headers: { accept: 'application/vnd.github.symmetra-preview+json' }
        })

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'new-description',
          name: 'new-description',
          color: '000000',
          description: 'Hello world',
          headers: { accept: 'application/vnd.github.symmetra-preview+json' }
        })

        expect(github.issues.deleteLabel).toHaveBeenCalledTimes(1)
        expect(github.issues.updateLabel).toHaveBeenCalledTimes(3)
        expect(github.issues.createLabel).toHaveBeenCalledTimes(1)
      })
    })
  })
})
