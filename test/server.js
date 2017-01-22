const expect = require('expect');
const Server = require('../lib/server');

describe('Server', () => {
  let event;
  let server;

  beforeEach(() => {
    server = new Server();
    event = {
      payload: JSON.parse(JSON.stringify(require('./fixtures/events/push.settings.json')))
    };
  });

  describe('receive', () => {
    describe('with settings modified on master', () => {
      it('syncs settings', () => {
        server.sync = expect.createSpy();
        server.receive(event);
        expect(server.sync).toHaveBeenCalled();
      });
    });

    describe('on another branch', () => {
      beforeEach(() => {
        server.sync = expect.createSpy();
        event.payload.ref = 'refs/heads/other-branch';
      });

      it('does not sync settings', () => {
        server.receive(event);
        expect(server.sync).toNotHaveBeenCalled();
      });
    });

    describe('with other files modified', () => {
      beforeEach(() => {
        server.sync = expect.createSpy();
        event.payload = require('./fixtures/events/push.readme.json');
      });

      it('does not sync settings', () => {
        server.receive(event);
        expect(server.sync).toNotHaveBeenCalled();
      });
    });
  });
});
