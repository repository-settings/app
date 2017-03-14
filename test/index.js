const expect = require('expect');
const plugin = require('../index');

describe('plugin', () => {
  let event;
  let hooks;
  let robot;
  let sync;

  beforeEach(() => {
    hooks = {};

    robot = {
      on: (name, callback) => {
        hooks[name] = callback;
      },
      auth: () => Promise.resolve({})
    };

    event = {
      payload: JSON.parse(JSON.stringify(require('./fixtures/events/push.settings.json')))
    };
    sync = expect.createSpy();

    plugin(robot, {}, {sync, FILE_NAME: '.github/config.yml'});
  });

  describe('with settings modified on master', () => {
    it('syncs settings', async () => {
      await hooks.push(event);
      expect(sync).toHaveBeenCalled();
    });
  });

  describe('on another branch', () => {
    beforeEach(() => {
      event.payload.ref = 'refs/heads/other-branch';
    });

    it('does not sync settings', async () => {
      await hooks.push(event);
      expect(sync).toNotHaveBeenCalled();
    });
  });

  describe('with other files modified', () => {
    beforeEach(() => {
      event.payload = require('./fixtures/events/push.readme.json');
    });

    it('does not sync settings', () => {
      hooks.push(event);
      expect(sync).toNotHaveBeenCalled();
    });
  });
});
