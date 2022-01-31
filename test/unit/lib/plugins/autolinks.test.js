const Autolinks = require('../../../../lib/plugins/autolinks')

describe('Autolinks', () => {
  let github

  function configure (config) {
    return new Autolinks(github, { owner: 'bkeepers', repo: 'test' }, config)
  }

  beforeEach(() => {
    github = {
      paginate: jest.fn().mockImplementation(() => Promise.resolve()),
      repos: {
        listAutolinks: {
          endpoint: {
            merge: jest.fn().mockImplementation(() => {})
          }
        },
        deleteAutolink: jest.fn().mockImplementation(() => Promise.resolve()),
        createAutolink: jest.fn().mockImplementation(() => Promise.resolve())
      }
    }
  })

  describe('sync', () => {
    it('syncs autolinks', () => {
      github.paginate.mockReturnValueOnce(Promise.resolve([
        {
          id: 1,
          key_prefix: 'ASDF-',
          url_template: 'https://jira.company.com/browse/ASDF-<num>'
        },
        {
          id: 2,
          key_prefix: 'TEST-',
          url_template: 'https://jira.company.com/browse/TEST-<num>'
        }
      ]))

      const plugin = configure([
        {
          key_prefix: 'ASDF-',
          url_template: 'https://jira.company.com/browse/ASDF-<num>'
        },
        {
          key_prefix: 'BOLIGRAFO-',
          url_template: 'https://jira.company.com/browse/BOLIGRAFO-<num>'
        }
      ])

      return plugin.sync().then(() => {
        expect(github.repos.createAutolink).toHaveBeenCalledWith({
          key_prefix: 'BOLIGRAFO-',
          url_template: 'https://jira.company.com/browse/BOLIGRAFO-<num>',
          owner: 'bkeepers',
          repo: 'test',
          headers: { accept: 'application/vnd.github.v3+json' }
        })

        expect(github.repos.createAutolink).toHaveBeenCalledTimes(1)

        expect(github.repos.deleteAutolink).toHaveBeenCalledWith({
          autolink_id: 2,
          owner: 'bkeepers',
          repo: 'test',
          headers: { accept: 'application/vnd.github.v3+json' }
        })

        expect(github.repos.deleteAutolink).toHaveBeenCalledTimes(1)
      })
    })
  })
})
