import Repository from '../../../../lib/plugins/repository'
import { jest } from '@jest/globals'

describe('Repository', () => {
  let github
  const repoOwner = 'bkeepers'
  const repoName = 'test'

  function configure (config) {
    return new Repository(github, { owner: repoOwner, repo: repoName }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn().mockImplementation(() => Promise.resolve())
    }
  })

  describe('sync', () => {
    it('syncs repository settings', () => {
      const plugin = configure({
        name: 'test',
        description: 'Hello World!'
      })
      return plugin.sync().then(() => {
        expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}', {
          owner: repoOwner,
          repo: repoName,
          name: repoName,
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
        expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}', {
          owner: repoOwner,
          repo: repoName,
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
        expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/topics', {
          owner: repoOwner,
          repo: repoName,
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
          expect(github.request).not.toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/vulnerability-alerts', {
            owner: repoOwner,
            repo: repoName,
            mediaType: {
              previews: ['dorian']
            }
          })
        })
      })

      it('enables vulerability alerts when set to true', async () => {
        const plugin = configure({
          enable_vulnerability_alerts: true
        })

        await plugin.sync()

        expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/vulnerability-alerts', {
          owner: repoOwner,
          repo: repoName,
          mediaType: {
            previews: ['dorian']
          }
        })
      })

      it('disables vulerability alerts when set to false', async () => {
        const plugin = configure({
          enable_vulnerability_alerts: false
        })

        await plugin.sync()

        expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/vulnerability-alerts', {
          owner: repoOwner,
          repo: repoName,
          mediaType: {
            previews: ['dorian']
          }
        })
      })
    })

    describe('automated security fixes', () => {
      it('it skips if not set', async () => {
        const plugin = configure({
          enable_automated_security_fixes: undefined
        })

        await plugin.sync()

        expect(github.request).not.toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/automated-security-fixes', {
          owner: repoOwner,
          repo: repoName,
          mediaType: {
            previews: ['london']
          }
        })
      })

      it('enables vulerability alerts when set to true', () => {
        const plugin = configure({
          enable_automated_security_fixes: true
        })

        return plugin.sync().then(() => {
          expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/automated-security-fixes', {
            owner: repoOwner,
            repo: repoName,
            mediaType: {
              previews: ['london']
            }
          })
        })
      })

      it('disables vulnerability alerts when set to false', async () => {
        const plugin = configure({
          enable_automated_security_fixes: false
        })

        await plugin.sync()

        expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/automated-security-fixes', {
          owner: repoOwner,
          repo: repoName,
          mediaType: {
            previews: ['london']
          }
        })
      })
    })
  })
})
