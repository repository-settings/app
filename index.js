import mergeArrayByName from './lib/mergeArrayByName.js'
import SettingsApp from './lib/settings.js'

/**
 * @param {import('probot').Probot} robot
 */
export default (robot, _, Settings = SettingsApp) => {
  async function loadConfig (context) {
    for (const filePath of Settings.FILE_NAMES) {
      const fileName = filePath.replace(/^\.github\//, '')
      const config = await context.config(fileName, undefined, { arrayMerge: mergeArrayByName })

      if (config !== null) {
        return config
      }
    }

    return {}
  }

  async function syncSettings (context, repo = context.repo()) {
    const config = await loadConfig(context)
    return Settings.sync(context.octokit, repo, config)
  }

  robot.on('push', async context => {
    const { payload } = context
    const { repository } = payload

    const defaultBranch = payload.ref === 'refs/heads/' + repository.default_branch
    if (!defaultBranch) {
      robot.log.debug('Not working on the default branch, returning...')
      return
    }

    const settingsModified = payload.commits.find(commit => {
      return Settings.FILE_NAMES.some(fileName => {
        return commit.added.includes(fileName) || commit.modified.includes(fileName)
      })
    })

    if (!settingsModified) {
      robot.log.debug(`No changes in '${Settings.FILE_NAMES.join("', '")}' detected, returning...`)
      return
    }

    return syncSettings(context)
  })

  robot.on('repository.edited', async context => {
    const { payload } = context
    const { changes, repository } = payload

    if (!Object.prototype.hasOwnProperty.call(changes, 'default_branch')) {
      robot.log.debug('Repository configuration was edited but the default branch was not affected, returning...')
      return
    }

    robot.log.debug(`Default branch changed from '${changes.default_branch.from}' to '${repository.default_branch}'`)

    return syncSettings(context)
  })

  robot.on('repository.created', async context => syncSettings(context))
}
