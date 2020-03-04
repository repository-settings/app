const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (robot, _, Settings = require('./lib/settings')) => {
  async function syncSettings (context, repo = context.repo()) {
    const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })
    const payload = context.payload
    const checkOptions = {
      owner: repo.owner,
      repo: repo.repo,
      name: 'Settings',
      head_sha: payload.after,
      status: 'queued'
    }

    return context.github.apps.getInstallation({ installation_id: payload.installation.id }).then((response) => {
      if (response.data.permissions.checks === 'write') {
        return context.github.checks.create(checkOptions).then(() => {
          return Settings.sync(context.github, repo, config).then(() => {
            checkOptions.conclusion = 'success'
          }).catch(res => {
            checkOptions.conclusion = 'failure'
            const summary = `
    There was an error while updating the repository settings.
  
    <details><summary>Failed response</summary>
    <pre>
    ${JSON.stringify(JSON.parse(res.message), null, 2)}
    </pre>
    </details>
    `
            checkOptions.output = {
              title: 'Settings Probot',
              summary: summary
            }
          }).then(() => {
            checkOptions.status = 'completed'
            return context.github.checks.create(checkOptions)
          })
        })
      } else {
        return Settings.sync(context.github, repo, config)
      }
    })
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
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
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
}
