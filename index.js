const getConfig = require('probot-config')

/**
 * @param {import('probot').Application} app - Probot's Application class.
 */
module.exports = async (app, _, Settings = require('./lib/settings')) => {
  app.on('push', async context => {
    const payload = context.payload
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch

    const config = await getConfig(context, 'settings.yml')

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    if (defaultBranch && settingsModified) {
      return Settings.sync(context.github, context.repo(), config)
    }
  })

  const { data: installations } = await (await app.auth()).apps.getInstallations({})
  const github = await app.auth(installations[0].id)
  const repos = await github.apps.getInstallationRepositories({})

  const repository = repos.data.repositories[0]
  const settings = new Settings(github, {owner: repository.owner.login, repo: repository.name}, {})

  console.log('READ', await settings.read())
}
