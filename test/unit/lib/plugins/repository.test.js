const Repository = require('../../../../lib/plugins/repository')

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
        replaceAllTopics: jest.fn().mockImplementation(() => Promise.resolve()),
        enableVulnerabilityAlerts: jest.fn().mockImplementation(() => Promise.resolve()),
        disableVulnerabilityAlerts: jest.fn().mockImplementation(() => Promise.resolve()),
        enableAutomatedSecurityFixes: jest.fn().mockImplementation(() => Promise.resolve()),
        disableAutomatedSecurityFixes: jest.fn().mockImplementation(() => Promise.resolve())
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
          description: 'Hello World!',
          mediaType: { previews: ['baptiste'] }
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
          name: 'new-name',
          mediaType: { previews: ['baptiste'] }
        })
      })
    })

    it('syncs topics', () => {
      const plugin = configure({
        topics: 'foo, bar'
      })

      return plugin.sync().then(() => {
        expect(github.repos.replaceAllTopics).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          names: ['foo', 'bar'],
          mediaType: {
            previews: ['mercy']
          }
        })
      })
    })

    describe('vulnerability alerts', () => {
      it('it skips if not set', () => {
        const plugin = configure({
          enable_vulnerability_alerts: undefined
        })

        return plugin.sync().then(() => {
          expect(github.repos.enableVulnerabilityAlerts).not.toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            mediaType: {
              previews: ['dorian']
            }
          })
        })
      })

      it('enables vulerability alerts when set to true', () => {
        const plugin = configure({
          enable_vulnerability_alerts: true
        })

        return plugin.sync().then(() => {
          expect(github.repos.enableVulnerabilityAlerts).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            mediaType: {
              previews: ['dorian']
            }
          })
        })
      })

      it('disables vulerability alerts when set to false', () => {
        const plugin = configure({
          enable_vulnerability_alerts: false
        })

        return plugin.sync().then(() => {
          expect(github.repos.disableVulnerabilityAlerts).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            mediaType: {
              previews: ['dorian']
            }
          })
        })
      })
    })

    describe('automated security fixes', () => {
      it('it skips if not set', () => {
        const plugin = configure({
          enable_automated_security_fixes: undefined
        })

        return plugin.sync().then(() => {
          expect(github.repos.enableAutomatedSecurityFixes).not.toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            mediaType: {
              previews: ['london']
            }
          })
        })
      })

      it('enables vulerability alerts when set to true', () => {
        const plugin = configure({
          enable_automated_security_fixes: true
        })

        return plugin.sync().then(() => {
          expect(github.repos.enableAutomatedSecurityFixes).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            mediaType: {
              previews: ['london']
            }
          })
        })
      })

      it('disables vulerability alerts when set to false', () => {
        const plugin = configure({
          enable_automated_security_fixes: false
        })

        return plugin.sync().then(() => {
          expect(github.repos.disableAutomatedSecurityFixes).toHaveBeenCalledWith({
            owner: 'bkeepers',
            repo: 'test',
            mediaType: {
              previews: ['london']
            }
          })
        })
      })
    })
  })
})
