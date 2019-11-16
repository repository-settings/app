const yaml = require('js-yaml')
const merge = require('deepmerge')
const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (robot, _, Settings = require('./lib/settings')) => {
  async function onPush (context) {
    const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
    Settings.sync(context.github, context.repo(), config)
  }

  async function listRepos (github, { login, type }) {
    var listForOrg
    if (type.toLowerCase() === 'organization') {
      listForOrg = github.paginate(
        github.repos.listForOrg.endpoint.merge({
          org: login
        })
      )
    } else {
      listForOrg = github.paginate(
        github.repos.listForUser.endpoint.merge({
          username: login
        })
      )
    }

    return listForOrg
  }

  async function loadYaml (github, params) {
    try {
      const response = await github.repos.getContents(params)

      // Ignore in case path is a folder
      // - https://developer.github.com/v3/repos/contents/#response-if-content-is-a-directory
      if (Array.isArray(response.data)) {
        return null
      }

      // we don't handle symlinks or submodule
      // - https://developer.github.com/v3/repos/contents/#response-if-content-is-a-symlink
      // - https://developer.github.com/v3/repos/contents/#response-if-content-is-a-submodule
      if (typeof response.data.content !== 'string') {
        return
      }

      return yaml.safeLoad(Buffer.from(response.data.content, 'base64').toString()) || {}
    } catch (e) {
      if (e.status === 404) {
        return null
      }

      throw e
    }
  }

  async function triggerRepositoryUpdate (context, baseConfig, { owner, repo }) {
    const { github } = context

    const config = await loadYaml(github, {
      owner,
      repo,
      path: Settings.FILE_NAME
    })

    if (config === null) {
      robot.log.debug(`File '${Settings.FILE_NAME}' not found in '${owner}/${repo}', returning...`)
      return
    }

    return Settings.sync(context.github, { owner, repo }, merge(baseConfig, config))
  }

  async function onPushTemplate (context) {
    const { github, payload } = context
    const { login, type } = payload.repository.owner

    const baseConfig = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
    const repositories = await listRepos(github, { login, type })
    await repositories.filter(repo => repo.name !== '.github').map(async (repo) => {
      triggerRepositoryUpdate(context, baseConfig, { owner: login, repo: repo.name })
    })
  }

  robot.on('push', async context => {
    const { payload } = context
    const { repository } = payload
    const { name: repositoryName } = repository

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

    await onPush(context)
    if (repositoryName === '.github') {
      await onPushTemplate(context)
    }
  })
}
