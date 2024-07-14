import { Probot, ProbotOctokit } from 'probot'
import any from '@travi/any'
import plugin from '../../index.js'
import { readFileSync } from 'fs'
import { jest } from '@jest/globals'

const pushSettings = JSON.parse(readFileSync(new URL('../fixtures/events/push.settings.json', import.meta.url)))
const pushReadme = JSON.parse(readFileSync(new URL('../fixtures/events/push.readme.json', import.meta.url)))
const repositoryEdited = JSON.parse(readFileSync(new URL('../fixtures/events/repository.edited.json', import.meta.url)))

describe('plugin', () => {
  let app, event, sync

  beforeEach(() => {
    class Octokit {
      static defaults () {
        return ProbotOctokit
      }

      constructor () {
        this.config = {
          get: jest.fn().mockReturnValue({})
        }
      }

      auth () {
        return this
      }
    }

    app = new Probot({ secret: any.string(), Octokit })

    event = {
      name: 'push',
      payload: pushSettings
    }
    sync = jest.fn()

    plugin(app, {}, { sync, FILE_NAME: '.github/settings.yml' })
  })

  describe('with settings modified on master', () => {
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
  })
})
