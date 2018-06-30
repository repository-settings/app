const {createRobot} = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let robot, event, sync, github

  beforeEach(() => {
    robot = createRobot()
    github = {
      repos: {
        getContent: jest.fn(() => Promise.resolve({ data: { content: '' } }))
      }
    }
    robot.auth = () => Promise.resolve(github)

    event = {
      event: 'push',
      payload: JSON.parse(JSON.stringify(require('./fixtures/events/push.settings.json')))
    }
    sync = jest.fn()

    plugin(robot, {}, {sync, FILE_NAME: '.github/settings.yml'})
  })

  describe('with settings modified on master', () => {
    it('syncs settings', async () => {
      await robot.receive(event)
      expect(sync).toHaveBeenCalled()
    })
  })

  describe('on another branch', () => {
    beforeEach(() => {
      event.payload.ref = 'refs/heads/other-branch'
    })

    it('does not sync settings', async () => {
      await robot.receive(event)
      expect(sync).not.toHaveBeenCalled()
    })
  })

  describe('with other files modified', () => {
    beforeEach(() => {
      event.payload = require('./fixtures/events/push.readme.json')
    })

    it('does not sync settings', () => {
      robot.receive(event)
      expect(sync).not.toHaveBeenCalled()
    })
  })
})
