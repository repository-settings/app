module.exports = (robot, _, Configurer = require('./lib/configurer')) => {
  robot.on('push', receive);

  async function receive(event) {
    const payload = event.payload;
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch;

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Configurer.FILE_NAME) ||
        commit.modified.includes(Configurer.FILE_NAME);
    });

    if (defaultBranch && settingsModified) {
      const github = await robot.auth(event.payload.installation.id);

      const repo = {
        owner: event.payload.repository.owner.name,
        repo: event.payload.repository.name
      };

      return Configurer.sync(github, repo);
    }
  }
};
