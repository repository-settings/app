const {createRobot} = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let robot
  let event
  let sync

  beforeEach(() => {
    robot = createRobot()
    robot.auth = () => Promise.resolve({})

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
    it('does not sync settings', () => {
      robot.receive(event)
      expect(sync).not.toHaveBeenCalled()
    })
  })
})
