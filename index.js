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
    } else if (!defaultBranch && settingsModified) {
      const fileModified = payload.commits.filter(commit => {
        return commit.added.includes(Settings.FILE_NAME) ||
          commit.modified.includes(Settings.FILE_NAME)
      })
      fileModified.forEach(async function (commit) {
        if (fileModified) {
          const ref = payload.ref.slice(11)
          const path = '.github/settings.yml'
          const owner = payload.repository.owner.login
          const repo = payload.repository.name
          const repoInfo = await context.github.repos.getContent({owner: owner, repo: repo, path: path, ref: ref})
          const content = repoInfo.data.content
          const sha = payload.commits[0].id
          const base64 = require('./encode')
          const result = base64.decode(content)
          const yaml = require('js-yaml')
          try {
            var doc = yaml.safeLoad(result)
            if (doc) {
              await context.github.repos.createStatus({owner: owner, repo: repo, sha: sha, state: 'success', description: 'Correct settings.yml file'})
            } else {
              context.log('Sorry')
            }
          } catch (e) {
            await context.github.repos.createStatus({owner: owner, repo: repo, sha: sha, state: 'error', description: 'Correct settings.yml file'})
          }
        }
      })
    }
  }
}
