const expect = require('expect');
const GitHubApi = require('github');
const Settings = require('../lib/configurer');

describe('Configurer', () => {
  const github = new GitHubApi();

  function configure(yaml) {
    return new Settings(github, {owner: 'bkeepers', repo: 'test'}, yaml);
  }

  beforeEach(() => {
    github.repos.get = expect.createSpy().andReturn(Promise.resolve({}));
    github.repos.edit = expect.createSpy().andReturn(Promise.resolve());
    github.issues.getLabels = expect.createSpy().andReturn(Promise.resolve([]));
    github.issues.createLabel = expect.createSpy().andReturn(Promise.resolve());
    github.issues.deleteLabel = expect.createSpy().andReturn(Promise.resolve());
    github.issues.updateLabel = expect.createSpy().andReturn(Promise.resolve());
  });

  describe('update', () => {
    it('syncs repository settings', () => {
      const config = configure(`
        repository:
          descripton: Hello World!
      `);
      return config.update().then(() => {
        expect(github.repos.edit).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'test',
          descripton: 'Hello World!'
        });
      });
    });

    it('handles renames', () => {
      const config = configure(`
        repository:
          name: new-name
      `);
      return config.update().then(() => {
        expect(github.repos.edit).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'new-name'
        });
      });
    });

    it('syncs labels', () => {
      github.issues.getLabels.andReturn(Promise.resolve([
        {name: 'no-change', color: 'FF0000'},
        {name: 'new-color', color: '000000'},
        {name: 'update-me', color: '0000FF'},
        {name: 'delete-me', color: '000000'}
      ]));

      const config = configure(`
        labels:
          - name: no-change
            color: FF0000
          - name: new-name
            oldname: update-me
            color: FFFFFF
          - name: new-color
            color: 999999
          - name: added
            color: FFCC00
      `);

      return config.update().then(() => {
        expect(github.issues.deleteLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'delete-me'
        });

        expect(github.issues.createLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          name: 'added',
          color: 'FFCC00'
        });

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'update-me',
          name: 'new-name',
          color: 'FFFFFF'
        });

        expect(github.issues.updateLabel).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          oldname: 'new-color',
          name: 'new-color',
          color: '999999'
        });

        expect(github.issues.deleteLabel.calls.length).toBe(1);
        expect(github.issues.updateLabel.calls.length).toBe(2);
        expect(github.issues.createLabel.calls.length).toBe(1);
      });
    });

    it('syncs collaborators', () => {
      github.repos.getCollaborators = expect.createSpy().andReturn(Promise.resolve([]));
      github.repos.removeCollaborator = expect.createSpy().andReturn(Promise.resolve());
      github.repos.addCollaborator = expect.createSpy().andReturn(Promise.resolve());

      // FIXME: figure out what this actual response is.
      github.repos.getCollaborators.andReturn(Promise.resolve([
        {username: 'bkeepers', permission: 'admin'},
        {username: 'updated-permission', permission: 'pull'},
        {username: 'removed-user', permission: 'push'}
      ]));

      const config = configure(`
        collaborators:
          - username: bkeepers
            permission: admin
          - username: added-user
            permission: push
          - username: updated-permission
            permission: push
      `);

      return config.update().then(() => {
        expect(github.repos.addCollaborator).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          username: 'added-user',
          permission: 'push'
        });

        expect(github.repos.addCollaborator).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          username: 'updated-permission',
          permission: 'push'
        });

        expect(github.repos.addCollaborator.calls.length).toBe(2);

        expect(github.repos.removeCollaborator).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          username: 'removed-user'
        });

        expect(github.repos.removeCollaborator.calls.length).toBe(1);
      });
    });
  });
});
