module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', receive)

  async function receive (context) {
    const payload = context.payload
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    if (defaultBranch && settingsModified) {
      return Settings.sync(context.github, context.repo())
    }
  }

  robot.on('installation_repositories.added', installSync)

  async function installSync (context) {
    const payload = context.payload
    // getting first repo id that is added
    const repoAddedId = await payload.repositories_added
    const repoAddedIds = []
    repoAddedId.forEach(async function (value) {
      await repoAddedIds.push(value.id)
    })
    repoAddedIds.forEach(async function (value) {
      const result = await context.github.repos.getById({id: value})
      const owner = result.data.owner.login
      const repoName = result.data.name
      // As context.repo() was undefined so had to convert it into object
      const repo = {
        owner: owner,
        repo: repoName
      }
      const path = '.github'
      const repoInfo = await context.github.repos.getContent({owner: owner, repo: repoName, path: path})
      const FILE_NAME = repoInfo.data[0].name
      if (FILE_NAME === 'settings.yml') {
        return Settings.sync(context.github, repo)
      } else {
        context.log('sorry no file found')
      }
    })
  }
}
