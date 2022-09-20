const { initializeNock, loadInstance, teardownNock, repository, buildTriggerEvent } = require('../common')
const path = require('path')
const fs = require('fs')
const settings = require('../../../lib/settings')
const { OK, CREATED, NO_CONTENT } = require('http-status-codes')
describe('branches plugin', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('configures labels', async () => {
    const pathToConfig = path.resolve(__dirname, '..', '..', 'fixtures', 'labels-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const config = configFile.toString()
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(settings.FILE_NAME)}`)
      .reply(OK, config)
    githubScope.get(`/repos/${repository.owner.name}/${repository.name}/labels?per_page=100`).reply(OK, [
      { name: 'bug', color: 'ee0701' },
      { name: 'duplicate', color: 'cccccc' },
      { name: 'help wanted', color: '128A0C' }
    ])
    githubScope
      .post(`/repos/${repository.owner.name}/${repository.name}/labels`, body => {
        expect(body).toMatchObject({ name: 'enhancement', color: '008672' })
        return true
      })
      .reply(CREATED)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}/labels/help%20wanted`, body => {
        expect(body).toMatchObject({ color: 'd876e3' })
        return true
      })
      .reply(OK)
    githubScope.delete(`/repos/${repository.owner.name}/${repository.name}/labels/duplicate`).reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
