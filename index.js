module.exports = (robot, _, Configurer = require('./lib/configurer')) => {
  robot.on('push', receive);

  async function receive(context) {
    const payload = context.payload;
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch;

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Configurer.FILE_NAME) ||
        commit.modified.includes(Configurer.FILE_NAME);
    });

    if (defaultBranch && settingsModified) {
      return Configurer.sync(context.github, context.repo());
    }
  }
};
