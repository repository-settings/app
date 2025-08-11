const enableAutomatedSecurityFixes = ({ github, settings, enabled }) => {
  if (enabled === undefined) {
    return Promise.resolve()
  }

  const verb = enabled ? 'PUT' : 'DELETE'

  return github.request(`${verb} /repos/{owner}/{repo}/automated-security-fixes`, {
    owner: settings.owner,
    repo: settings.repo,
    mediaType: {
      previews: ['london']
    }
  })
}

const enableVulnerabilityAlerts = ({ github, settings, enabled }) => {
  if (enabled === undefined) {
    return Promise.resolve()
  }

  const verb = enabled ? 'PUT' : 'DELETE'

  return github.request(`${verb} /repos/{owner}/{repo}/vulnerability-alerts`, {
    owner: settings.owner,
    repo: settings.repo,
    mediaType: {
      previews: ['dorian']
    }
  })
}

export default class Repository {
  constructor (github, repo, settings) {
    this.github = github
    this.settings = Object.assign({ mediaType: { previews: ['baptiste'] } }, settings, repo)
    this.topics = this.settings.topics
    delete this.settings.topics

    this.enableVulnerabilityAlerts = this.settings.enable_vulnerability_alerts
    delete this.settings.enable_vulnerability_alerts

    this.enableAutomatedSecurityFixes = this.settings.enable_automated_security_fixes
    delete this.settings.enable_automated_security_fixes
  }

  async sync () {
    this.settings.name = this.settings.name || this.settings.repo

    await this.github.request('PATCH /repos/{owner}/{repo}', this.settings)

    if (this.topics) {
      await this.github.request('PUT /repos/{owner}/{repo}/topics', {
        owner: this.settings.owner,
        repo: this.settings.repo,
        names: this.topics.split(/\s*,\s*/),
        mediaType: {
          previews: ['mercy']
        }
      })
    }

    await enableVulnerabilityAlerts({ enabled: this.enableVulnerabilityAlerts, ...this })
    await enableAutomatedSecurityFixes({ enabled: this.enableAutomatedSecurityFixes, ...this })
  }
}
