const Labels = require('../../../lib/plugins/labels')

describe('Labels', () => {
  let github

  function configure (config) {
    return new Labels(github, {owner: 'bkeepers', repo: 'test'}, config)
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
      github.issues.getLabels.mockReturnValueOnce(Promise.resolve({data: [
        {name: 'no-change', color: 'FF0000'},
        {name: 'new-color', color: '000000'},
        {name: 'update-me', color: '0000FF'},
        {name: 'delete-me', color: '000000'}
      ]}))

      const plugin = configure([
        {name: 'no-change', color: 'FF0000'},
        {name: 'new-name', oldname: 'update-me', color: 'FFFFFF'},
        {name: 'new-color', color: '999999'},
        {name: 'added'}
      ])

      return plugin.sync().then(() => {
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
  })
})
