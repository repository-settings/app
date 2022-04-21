import Repository from './plugins/repository'
import Labels from './plugins/labels'
import Collaborators from './plugins/collaborators'
import Teams from './plugins/teams'
import Milestones from './plugins/milestones'
import Branches from './plugins/branches'

export default class Settings {
  static sync (github, repo, config) {
    return new Settings(github, repo, config).update()
  }

  constructor (github, repo, config) {
    this.github = github
    this.repo = repo
    this.config = config
  }

  update () {
    return Promise.all(
      Object.entries(this.config).map(([section, config]) => {
        const debug = { repo: this.repo }
        debug[section] = config

        const Plugin = Settings.PLUGINS[section]
        return new Plugin(this.github, this.repo, config).sync()
      })
    )
  }
}

Settings.FILE_NAME = '.github/settings.yml'

Settings.PLUGINS = {
  repository: Repository,
  labels: Labels,
  collaborators: Collaborators,
  teams: Teams,
  milestones: Milestones,
  branches: Branches
}
