import { Probot } from 'probot'
import any from '@travi/any'
import plugin from '../../index.js'
import { readFileSync } from 'fs'
import { jest } from '@jest/globals'

const pushSettings = JSON.parse(readFileSync(new URL('../fixtures/events/push.settings.json', import.meta.url)))
const pushReadme = JSON.parse(readFileSync(new URL('../fixtures/events/push.readme.json', import.meta.url)))
const repositoryEdited = JSON.parse(readFileSync(new URL('../fixtures/events/repository.edited.json', import.meta.url)))

describe('plugin', () => {
  let app, event, sync, configGet

  beforeEach(() => {
    configGet = jest.fn().mockResolvedValue({ config: {}, files: [{ config: {} }] })

    class Octokit {
      static defaults () {
        return Octokit
      }

      constructor () {
        this.config = {
          get: configGet
        }
        this.hook = {
          before: () => {},
          after: () => {},
          error: () => {},
          wrap: () => {}
        }
      }

      auth () {
        return this
      }
    }

    app = new Probot({ secret: any.string(), Octokit, appId: any.string(), privateKey: any.string() })

    event = {
      name: 'push',
      payload: pushSettings
    }
    sync = jest.fn()

    plugin(app, {}, { sync, FILE_NAMES: ['.github/settings.yml', '.github/settings.yaml'] })
  })

  describe('with settings modified on master', () => {
    it('syncs settings', async () => {
      await app.receive(event)
      expect(configGet).toHaveBeenCalledWith(expect.objectContaining({ path: '.github/settings.yml' }))
      expect(sync).toHaveBeenCalled()
    })
  })

  describe('with settings.yaml modified on master', () => {
    beforeEach(() => {
      event.payload = JSON.parse(JSON.stringify(pushSettings))
      event.payload.ref = 'refs/heads/master'
      event.payload.commits[0].added = ['.github/settings.yaml']
      event.payload.head_commit.added = ['.github/settings.yaml']
    })

    it('syncs settings', async () => {
      await app.receive(event)
      expect(sync).toHaveBeenCalled()
    })
  })

  describe('on another branch', () => {
    beforeEach(() => {
      event.payload.ref = 'refs/heads/other-branch'
    })

    it('does not sync settings', async () => {
      await app.receive(event)
      expect(sync).not.toHaveBeenCalled()
    })
  })

  describe('with other files modified', () => {
    beforeEach(() => {
      event.payload = pushReadme
    })

    it('does not sync settings', async () => {
      await app.receive(event)
      expect(sync).not.toHaveBeenCalled()
    })
  })

  describe('default branch changed', () => {
    beforeEach(() => {
      event = {
        name: 'repository.edited',
        payload: repositoryEdited
      }
    })

    it('does sync settings', async () => {
      await app.receive(event)
      expect(sync).toHaveBeenCalled()
    })
  })

  describe('repository created', () => {
    beforeEach(() => {
      event = {
        name: 'repository.created',
        payload: {
          repository: {
            owner: {
              login: 'Martijn-Workspace'
            }
          }
        }
      }
    })

    it('does sync settings', async () => {
      await app.receive(event)
      expect(sync).toHaveBeenCalled()
    })

    describe('when settings.yml does not exist', () => {
      const yamlConfig = { repository: { name: any.word() } }

      beforeEach(() => {
        configGet
          .mockResolvedValueOnce({ config: null, files: [{ config: null }] })
          .mockResolvedValueOnce({ config: yamlConfig, files: [{ config: yamlConfig }] })
      })

      it('falls back to settings.yaml', async () => {
        await app.receive(event)

        expect(configGet).toHaveBeenCalledTimes(2)
        expect(configGet).toHaveBeenNthCalledWith(1, expect.objectContaining({ path: '.github/settings.yml' }))
        expect(configGet).toHaveBeenNthCalledWith(2, expect.objectContaining({ path: '.github/settings.yaml' }))
        expect(sync).toHaveBeenCalledWith(expect.anything(), expect.anything(), yamlConfig)
      })
    })

    describe('when neither settings.yml nor settings.yaml exists', () => {
      beforeEach(() => {
        configGet.mockResolvedValue({ config: null, files: [{ config: null }] })
      })

      it('syncs with an empty config', async () => {
        await app.receive(event)

        expect(configGet).toHaveBeenCalledTimes(2)
        expect(sync).toHaveBeenCalledWith(expect.anything(), expect.anything(), {})
      })
    })
  })
})
