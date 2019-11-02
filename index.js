const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', async context => {
    const { payload } = context
    const { repository } = payload

    const defaultBranch = payload.ref === 'refs/heads/' + repository.default_branch
    if (!defaultBranch) {
      robot.log.debug('Not the default branch, nothing to see here!')
      return
    }

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    if (settingsModified) {
      const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
      return Settings.sync(context.github, context.repo(), config)
    }
  })
}
