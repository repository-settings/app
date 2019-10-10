const { Application } = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let app, event, sync, github

  beforeEach(() => {
    app = new Application()
    github = {
      repos: {
        getContents: jest.fn(() => Promise.resolve({ data: { content: '' } }))
      }
    }
    app.auth = () => Promise.resolve(github)

    event = {
      name: 'push',
      payload: JSON.parse(JSON.stringify(require('./fixtures/events/push.settings.json')))
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
      event.payload = require('./fixtures/events/push.readme.json')
    })

    it('does not sync settings', () => {
      app.receive(event)
      expect(sync).not.toHaveBeenCalled()
    })
  })
})
