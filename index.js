import mergeArrayByName from './lib/mergeArrayByName'
import SettingsApp from './lib/settings'

/**
 * @param {import('probot').Probot} robot
 */
export default (robot, _, Settings = SettingsApp) => {
  async function syncSettings (context, repo = context.repo()) {
    const { host } = context
    const { GHE_HOST } = process.env
    if (host === 'github.com' && GHE_HOST) {
      robot.log.warn('Webhook source is public github, but GHE_HOST is set. Settings may not be read correctly.')
    }
    else if (host !== GHE_HOST) {
      robot.log.warn('Webhook source does not match GHE_HOST. Settings may not be read correctly.')
    }

    const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
    if (!config || !Object.keys(config).length) {
      robot.log.error(`Unable to read config from '${Settings.FILE_NAME}'`)
      return
    }
    const results = Settings.sync(context.octokit, repo, config)
    robot.log.debug('Synced settings')
    return results
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
      return commit.added.includes(Settings.FILE_NAME) || commit.modified.includes(Settings.FILE_NAME)
    })

    if (!settingsModified) {
      robot.log.debug(`No changes in '${Settings.FILE_NAME}' detected, returning...`)
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

  robot.on('repository.created', async context => {
    return syncSettings(context)
  })
}
