const expect = require('expect');
const Settings = require('../lib/configurer');

describe('Configurer', () => {
  let github;

  function configure(yaml) {
    return new Settings(github, {owner: 'bkeepers', repo: 'test'}, yaml);
  }

  beforeEach(() => {
    github = {
      repos: {
        get: expect.createSpy().andReturn(Promise.resolve({})),
        edit: expect.createSpy().andReturn(Promise.resolve())
      },
      issues: {
        getLabels: expect.createSpy().andReturn(Promise.resolve([])),
        createLabel: expect.createSpy().andReturn(Promise.resolve()),
        deleteLabel: expect.createSpy().andReturn(Promise.resolve()),
        updateLabel: expect.createSpy().andReturn(Promise.resolve())
      }
    };
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

      github.repos.getCollaborators.andReturn(Promise.resolve([
        {login: 'bkeepers', permissions: {admin: true, push: true, pull: true}},
        {login: 'updated-permission', permissions: {admin: false, push: false, pull: true}},
        {login: 'removed-user', permissions: {admin: false, push: true, pull: true}},
        {login: 'differentCase', permissions: {admin: false, push: true, pull: true}}
      ]));

      const config = configure(`
        collaborators:
          - username: bkeepers
            permission: admin
          - username: added-user
            permission: push
          - username: updated-permission
            permission: push
          - username: DIFFERENTcase
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

    it('syncs teams', () => {
      github.orgs = {};
      github.orgs.deleteTeamRepo = expect.createSpy().andReturn(Promise.resolve());
      github.orgs.addTeamRepo = expect.createSpy().andReturn(Promise.resolve());
      github.repos.getTeams = expect.createSpy().andReturn(Promise.resolve([
        {id: 1, slug: 'unchanged', permission: 'push'},
        {id: 2, slug: 'removed', permission: 'push'},
        {id: 3, slug: 'updated-permission', permission: 'pull'}
      ]));
      github.orgs.getTeams = expect.createSpy().andReturn(Promise.resolve([
        {id: 4, slug: 'added'}
      ]));

      const config = configure(`
        teams:
          - name: unchanged
            permission: push
          - name: updated-permission
            permission: admin
          - name: added
            permission: pull
      `);

      return config.update().then(() => {
        expect(github.orgs.addTeamRepo).toHaveBeenCalledWith({
          org: 'bkeepers',
          repo: 'test',
          id: 3,
          permission: 'admin'
        });

        expect(github.orgs.addTeamRepo).toHaveBeenCalledWith({
          org: 'bkeepers',
          repo: 'test',
          id: 4,
          permission: 'pull'
        });

        expect(github.orgs.addTeamRepo.calls.length).toBe(2);

        expect(github.orgs.deleteTeamRepo).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          id: 2
        });

        expect(github.orgs.deleteTeamRepo.calls.length).toBe(1);
      });
    });
  });
});
