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
    const encodedConfig = configFile.toString('base64')
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(200, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(config.repository)
        return true
      })
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)

    await probot.receive(buildTriggerEvent())
  })
})
