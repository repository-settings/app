const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const settings = require('../../../lib/settings')
const { buildTriggerEvent, initializeNock, loadInstance, repository, teardownNock } = require('../common')

describe('repository plugin', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs repo settings', async () => {
    const pathToConfig = path.resolve(__dirname, '..', '..', 'fixtures', 'repository-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const config = yaml.safeLoad(configFile, 'utf8')
    const configContent = configFile.toString()
    const repoSettings = Object.assign({}, config.repository)
    const enableVulnerabilityAlert = repoSettings.enable_vulnerability_alerts
    delete repoSettings.enable_vulnerability_alerts

    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(settings.FILE_NAME)}`)
      .reply(200, configContent)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)

    if (enableVulnerabilityAlert) {
      const httpMethod = enableVulnerabilityAlert ? 'put' : 'delete'
      githubScope[httpMethod](`/repos/${repository.owner.name}/${repository.name}/vulnerability-alerts`, body => true)
        .matchHeader('accept', ['application/vnd.github.dorian-preview+json'])
        .reply(200)
    }

    await probot.receive(buildTriggerEvent())
  })
})
