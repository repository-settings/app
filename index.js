module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', receive)

  async function receive (context) {
    const yaml = require('js-yaml')
    const fs = require('fs')
    const payload = context.payload
    const defaultBranch =
      payload.ref === 'refs/heads/' + payload.repository.default_branch

    const settingsModified = payload.commits.find(commit => {
      return (
        commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
      )
    })

    if (defaultBranch && settingsModified) {
      return Settings.sync(context.github, context.repo())
    } else if (!defaultBranch && settingsModified) {
      try {
        yaml.safeLoad(fs.readFileSync('/settings/.github/settings.yml', 'utf8'))
      } catch (e) { // set error status if parsing fails
        let settingChangeCommit = await payload.commits.reverse().find(commit => {
          // get latest commit that changed settings.yml
          return (
            commit.added.includes(Settings.FILE_NAME) ||
            commit.modified.includes(Settings.FILE_NAME)
          )
        })
        try {
          const repo = context.repo()
          context.github.repos.createStatus({
            owner: repo.owner,
            repo: repo.repo,
            sha: settingChangeCommit.id,
            state: 'error'
          })
        } catch (e) {
          console.log(e)
        }
      }
    }
  }
}
