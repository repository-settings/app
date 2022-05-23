const { Probot } = require('probot')
const any = require('@travi/any')
const plugin = require('../../index')

describe('plugin', () => {
  let app, event, sync

  beforeEach(() => {
    class Octokit {
      static defaults () {
        return Octokit
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
      payload: JSON.parse(JSON.stringify(require('../fixtures/events/push.settings.json')))
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
      event.payload = require('../fixtures/events/push.readme.json')
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
        payload: require('../fixtures/events/repository.edited.json')
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
