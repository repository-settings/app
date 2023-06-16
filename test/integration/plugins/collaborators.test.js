const { CREATED, NO_CONTENT, OK } = require('http-status-codes')
const {
  buildTriggerEvent,
  initializeNock,
  loadInstance,
  repository,
  teardownNock,
  defineSettingsFileForScenario
} = require('../common')

describe('collaborators plugin', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs collaborators', async () => {
    await defineSettingsFileForScenario('collaborators-config.yml', githubScope)
    githubScope.get(`/repos/${repository.owner.name}/${repository.name}/collaborators?affiliation=direct`).reply(OK, [
      { login: 'travi', permissions: { admin: true } },
      { login: 'bkeepers', permissions: { push: true } }
    ])
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/collaborators/hubot`, body => {
        expect(body).toMatchObject({ permission: 'pull' })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/collaborators/octokit-bot`, body => {
        expect(body).toMatchObject({ permission: 'triage' })
        return true
      })
      .reply(CREATED)
    githubScope.delete(`/repos/${repository.owner.name}/${repository.name}/collaborators/travi`).reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
