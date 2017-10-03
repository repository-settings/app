module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', receive)

  async function receive (context) {
    const payload = context.payload
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch

    // const settingsModified = payload.commits.find(commit => {
    //   return commit.added.includes(Settings.FILE_NAME) ||
    //     commit.modified.includes(Settings.FILE_NAME)
    // })

    // if (defaultBranch && settingsModified) {
    if (defaultBranch) {
      return Settings.sync(context.github, context.repo())
    }
  }
}
