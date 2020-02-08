const { createProbot } = require('probot')
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const nock = require('nock')
const debugNock = require('debug')('nock')
const settings = require('../../lib/settings')
const settingsBot = require('../../')

nock.disableNetConnect()

describe('push', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = nock('https://api.github.com').log(debugNock)

    probot = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    probot.load(settingsBot)
  })

  afterEach(() => {
    expect(githubScope.isDone()).toBe(true)

    nock.cleanAll()
  })

  it('syncs settings', async () => {
    const repository = {
      default_branch: 'master',
      name: 'botland',
      owner: {
        name: 'bkeepers-inc',
        email: null
      }
    }

    const pathToConfig = path.resolve(__dirname, '..', 'fixtures', 'config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const config = yaml.safeLoad(configFile, 'utf8')
    const encodedConfig = configFile.toString('base64')
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(200, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(200, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject(config.repository)
        return true
      })
      .reply(200)

    await probot.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository,
        commits: [{ modified: [settings.FILE_NAME], added: [] }]
      }
    })
  })
})
