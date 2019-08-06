const createScheduler = require('probot-scheduler')
const getConfig = require('probot-config')
const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (robot, _, Settings = require('./lib/settings')) => {
  createScheduler(robot)
  robot.on('push', async context => {
    const payload = context.payload
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch

    const config = await getConfig(context, 'settings.yml', {}, { arrayMerge: mergeArrayByName })

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    if (defaultBranch && settingsModified) {
      return Settings.sync(context.github, context.repo(), config)
    }
  })

  robot.on('schedule.repository', async context => {
    const config = await getConfig(context, 'settings.yml', {}, { arrayMerge: mergeArrayByName })

    return Settings.sync(context.github, context.repo(), config)
  })
}
