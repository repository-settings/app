class Settings {
  static sync (github, repo, config) {
    return github.repos.getContent({
      owner: repo.owner,
      repo: repo.repo,
      path: Settings.FILE_NAME
    }).then(res => {
      return new Settings(github, repo, config).update()
    })
  }

  constructor (github, repo, config) {
    this.github = github
    this.repo = repo
    this.config = config
  }

  update () {
    return Promise.all(Object.entries(this.config).map(([section, config]) => {
      const debug = {repo: this.repo}
      debug[section] = config

      const Plugin = Settings.PLUGINS[section]
      return new Plugin(this.github, this.repo, config).sync()
    }))
  }

  async read () {
    const configs = await Promise.all(Object.keys(Settings.PLUGINS).map(async (section) => {
      const Plugin = Settings.PLUGINS[section]
      const plugin = new Plugin(this.github, this.repo)
      console.log('reading config for ', section, this.repo, plugin.read)
      if (!plugin.read) { return {} }

      const config = {}
      config[section] = await plugin.read()
      return config
    }))

    // merge all the configs together
    return Object.assign(...configs)
  }
}

Settings.FILE_NAME = '.github/settings.yml'

Settings.PLUGINS = {
  repository: require('./plugins/repository'),
  labels: require('./plugins/labels'),
  collaborators: require('./plugins/collaborators'),
  teams: require('./plugins/teams'),
  milestones: require('./plugins/milestones'),
  branches: require('./plugins/branches')
}

module.exports = Settings
