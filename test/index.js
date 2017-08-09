const expect = require('expect');
const {createRobot} = require('probot');
const plugin = require('../index');

describe('plugin', () => {
  let robot;
  let event;
  let sync;

  beforeEach(() => {
    robot = createRobot();
    robot.auth = () => Promise.resolve({});

    event = {
      event: 'push',
      payload: JSON.parse(JSON.stringify(require('./fixtures/events/push.settings.json')))
    };
    sync = expect.createSpy();

    plugin(robot, {}, {sync, FILE_NAME: '.github/settings.yml'});
  });

  describe('with settings modified on master', () => {
    it('syncs settings', async () => {
      await robot.receive(event);
      expect(sync).toHaveBeenCalled();
    });
  });

  describe('on another branch', () => {
    beforeEach(() => {
      event.payload.ref = 'refs/heads/other-branch';
    });

    it('does not sync settings', async () => {
      await robot.receive(event);
      expect(sync).toNotHaveBeenCalled();
    });
  });

  describe('with other files modified', () => {
    beforeEach(() => {
      event.payload = require('./fixtures/events/push.readme.json');
    });

    it('does not sync settings', () => {
      robot.receive(event);
      expect(sync).toNotHaveBeenCalled();
    });
  });
});
