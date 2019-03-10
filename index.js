const getConfig = require('probot-config')
const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (app, _, Settings = require('./lib/settings')) => {
  app.on('push', async context => {
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
}
