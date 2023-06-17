const { OK } = require('http-status-codes')
const {
  buildTriggerEvent,
  initializeNock,
  loadInstance,
  repository,
  teardownNock,
  defineSettingsFileForScenario
} = require('../common')

describe('repository plugin', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs repo with basic settings', async () => {
    const config = await defineSettingsFileForScenario('repository/basic-config.yml', githubScope)
    const repoSettings = Object.assign({}, config.repository)

    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(OK)

    await probot.receive(buildTriggerEvent())
  })

  it('replaces topics, when provided', async () => {
    const config = await defineSettingsFileForScenario('repository/basic-config-with-topics.yml', githubScope)
    const repoSettings = Object.assign({}, config.repository)

    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(OK)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/topics`, body => {
        expect(body).toMatchObject({ names: ['github', 'probot'] })
        return true
      })
      .matchHeader('accept', ['application/vnd.github.mercy-preview+json'])
      .reply(OK)

    await probot.receive(buildTriggerEvent())
  })

  it('syncs repo with basic settings and vulnerability alerts enabled', async () => {
    const config = await defineSettingsFileForScenario(
      'repository/basic-config-with-vulnerability-alerts.yml',
      githubScope
    )
    const repoSettings = Object.assign({}, config.repository)
    delete repoSettings.enable_vulnerability_alerts

    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(OK)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/vulnerability-alerts`, body => true)
      .matchHeader('accept', ['application/vnd.github.dorian-preview+json'])
      .reply(OK)

    await probot.receive(buildTriggerEvent())
  })

  it('syncs repo with basic settings and security fixes enabled', async () => {
    const config = await defineSettingsFileForScenario('repository/basic-config-with-security-fixes.yml', githubScope)
    const repoSettings = Object.assign({}, config.repository)
    delete repoSettings.enable_automated_security_fixes

    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(repoSettings)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(OK)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/automated-security-fixes`, body => true)
      .matchHeader('accept', ['application/vnd.github.london-preview+json'])
      .reply(OK)

    await probot.receive(buildTriggerEvent())
  })
})
