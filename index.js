const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', async context => {
    const { payload } = context
    const { repository } = payload

    const defaultBranch = payload.ref === 'refs/heads/' + repository.default_branch
    if (!defaultBranch) {
      robot.log.debug('Not working on the default branch, returning...')
      return
    }

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    if (!settingsModified) {
      robot.log.debug(`No changes in '${Settings.FILE_NAME}' detected, returning...`)
      return
    }

    const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
    return Settings.sync(context.github, context.repo(), config)
  })

  robot.on('repository.edited', async context => {
    const { payload } = context
    const { changes, repository } = payload

    if (!changes.hasOwnProperty('default_branch')) {
      robot.log.debug('Repository configuration was edited but the default branch was not affected, returning...')
      return
    }

    robot.log.debug(`Default branch changed from '${changes.default_branch.from}' to '${repository.default_branch}'`)

    const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
    return Settings.sync(context.github, context.repo(), config)
  })
}
