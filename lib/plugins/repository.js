module.exports = class Repository {
  constructor (github, repo, settings) {
    this.github = github
    this.settings = Object.assign({}, settings, repo)
    this.topics = this.settings.topics
    delete this.settings.topics
  }

  sync () {
    this.settings.name = this.settings.name || this.settings.repo
    return this.github.repos.update(this.settings).then(() => {
      if (this.topics) {
        return this.github.repos.replaceTopics({
          owner: this.settings.owner,
          repo: this.settings.repo,
          names: this.topics.split(/\s*,\s*/),
          mediaType: {
            previews: ['mercy']
          }
        })
      }
    })
  }
}
