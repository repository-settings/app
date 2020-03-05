const { createProbot } = require('probot')
const { CREATED, NO_CONTENT, OK } = require('http-status-codes')
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')
const nock = require('nock')
const debugNock = require('debug')('nock')
const settings = require('../../lib/settings')
const settingsBot = require('../../')

nock.disableNetConnect()

const repository = {
  default_branch: 'master',
  name: 'botland',
  owner: {
    name: 'bkeepers-inc',
    email: null
  }
}
const installation = {
  id: '1'
}

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

  it('syncs repo settings', async () => {
    const pathToConfig = path.resolve(__dirname, '..', 'fixtures', 'repository-config.yml')
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
      .matchHeader('accept', ['application/vnd.github.baptiste-preview+json'])
      .reply(200)
    githubScope
      .post(`/repos/${repository.owner.name}/${repository.name}/check-runs`)
      .twice()
      .reply(201)
    githubScope
      .get(`/app/installations/${installation.id}`)
      .matchHeader('accept', ['application/vnd.github.machine-man-preview+json'])
      .reply(200, { permissions: { checks: 'write' } })
    await probot.receive({
        name: 'push',
        payload: {
          ref: 'refs/heads/master',
          repository,
          installation,
          after: 'head_sha',
          commits: [{ modified: [settings.FILE_NAME], added: [] }]
        }
      })
  })

  it('syncs collaborators', async () => {
    const pathToConfig = path.resolve(__dirname, '..', 'fixtures', 'collaborators-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const encodedConfig = configFile.toString('base64')
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(OK, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(OK, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/collaborators`)
      .reply(
        OK,
        [
          { login: 'travi', permissions: { admin: true } },
          { login: 'bkeepers', permissions: { push: true } }
        ]
      )
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/collaborators/hubot`, body => {
        expect(body).toMatchObject({ permission: 'pull' })
        return true
      })
      .reply(CREATED)
    githubScope
      .delete(`/repos/${repository.owner.name}/${repository.name}/collaborators/travi`)
      .reply(NO_CONTENT)
    githubScope
      .get(`/app/installations/${installation.id}`)
      .matchHeader('accept', ['application/vnd.github.machine-man-preview+json'])
      .reply(200, { permissions: { checks: 'read' } })

    await probot.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository,
        installation,
        after: 'head_sha',
        commits: [{ modified: [settings.FILE_NAME], added: [] }]
      }
    })    
  })
})
