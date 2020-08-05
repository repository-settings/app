const enableVulnerabilityAlerts = ({ github, settings, enabled }) => {
  if (enabled === undefined) {
    return Promise.resolve()
  }

  const args = {
    owner: settings.owner,
    repo: settings.repo,
    mediaType: {
      previews: ['dorian']
    }
  }
  const methodName = enabled ? 'enableVulnerabilityAlerts' : 'disableVulnerabilityAlerts'

  return github.repos[methodName](args)
}

module.exports = class Repository {
  constructor (github, repo, settings) {
    this.github = github
    this.settings = Object.assign({ mediaType: { previews: ['baptiste'] } }, settings, repo)
    this.topics = this.settings.topics
    delete this.settings.topics

    this.enableVulnerabilityAlerts = this.settings.enable_vulnerability_alerts
    delete this.settings.enable_vulnerability_alerts
  }

  sync () {
    this.settings.name = this.settings.name || this.settings.repo
    return this.github.repos.update(this.settings)
      .then(() => {
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
      .then(() => enableVulnerabilityAlerts({ enabled: this.enableVulnerabilityAlerts, ...this }))
  }
}
