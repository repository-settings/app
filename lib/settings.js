class Settings {
  static sync (github, repo, config) {
    return new Settings(github, repo, config).update()
  }

  constructor (github, repo, config) {
    this.github = github
    this.repo = repo
    this.config = config
  }

  update () {
    const { branches, ...rest } = this.config

    return Promise.all(
      Object.entries(rest).map(([section, config]) => {
        return this.processSection(section, config)
      })
    ).then(() => {
      if (Array.isArray(branches)) {
        return this.processSection('restBranches', branches)
      } else {
        if (branches.engine == 'graphql') {
          return this.processSection('graphqlBranches', branches.branchProtectionRules)
        } else {
          return this.processSection('restBranches', branches.branchProtectionRules)
        }
      }
    })
  }

  processSection (section, config) {
    const debug = { repo: this.repo }
    debug[section] = config

    const Plugin = Settings.PLUGINS[section]
    return new Plugin(this.github, this.repo, config).sync()
  }
}

Settings.FILE_NAME = '.github/settings.yml'

Settings.PLUGINS = {
  repository: require('./plugins/repository'),
  labels: require('./plugins/labels'),
  collaborators: require('./plugins/collaborators'),
  environments: require('./plugins/environments'),
  teams: require('./plugins/teams'),
  milestones: require('./plugins/milestones'),
  restBranches: require('./plugins/restBranches'),
  graphqlBranches: require('./plugins/graphqlBranches'),
}

module.exports = Settings
