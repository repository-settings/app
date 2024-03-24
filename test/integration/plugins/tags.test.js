const {
  initializeNock,
  loadInstance,
  teardownNock,
  repository,
  buildTriggerEvent,
  defineSettingsFileForScenario
} = require('../common')
const { OK, CREATED, NO_CONTENT } = require('http-status-codes')
describe('tags plugin', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('configures tags', async () => {
    await defineSettingsFileForScenario('tags-config.yml', githubScope)
    githubScope.get(`/repos/${repository.owner.name}/${repository.name}/tags/protection`).reply(OK, [
      { id: '1', pattern: '*' },
      { id: '2', pattern: 'duplicate' }
    ])

    githubScope
      .post(`/repos/${repository.owner.name}/${repository.name}/tags/protection`, body => {
        expect(body).toMatchObject({ pattern: 'v1' })
        return true
      })
      .reply(CREATED)
    githubScope.delete(`/repos/${repository.owner.name}/${repository.name}/tags/protection/1`).reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
