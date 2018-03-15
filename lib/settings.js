const yaml = require('js-yaml')

class Settings {
  static sync (github, repo) {
    return github.repos.getContent({
      owner: repo.owner,
      repo: repo.repo,
      path: Settings.FILE_NAME
    }).then(res => {
      const content = Buffer.from(res.data.content, 'base64').toString()
      return new Settings(github, repo, content).update()
    })
  }

  constructor (github, repo, config) {
    this.github = github
    this.repo = repo
    this.config = yaml.safeLoad(config)
  }

  update () {
    return Promise.all(Object.entries(this.config).map(([section, config]) => {
      const debug = {repo: this.repo}
      debug[section] = config

      const Plugin = Settings.PLUGINS[section]
      return new Plugin(this.github, this.repo, config).sync()
    }))
  }
}

Settings.FILE_NAME = '.github/settings.yml'

Settings.PLUGINS = {
  repository: require('./plugins/repository'),
  labels: require('./plugins/labels'),
  collaborators: require('./plugins/collaborators'),
  teams: require('./plugins/teams'),
  branches: require('./plugins/branches')
}

module.exports = Settings
