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

    await probot.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository,
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
      .get(`/repos/${repository.owner.name}/${repository.name}/collaborators?affiliation=direct`)
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

    await probot.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository,
        commits: [{ modified: [settings.FILE_NAME], added: [] }]
      }
    })
  })

  it('syncs teams', async () => {
    const pathToConfig = path.resolve(__dirname, '..', 'fixtures', 'teams-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const encodedConfig = configFile.toString('base64')
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(OK, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(OK, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/teams`)
      .reply(
        OK,
        [
          { slug: 'greenkeeper-keeper', permission: 'pull' },
          { slug: 'form8ion', permission: 'push' }
        ]
      )
    githubScope
      .put(`/orgs/${repository.owner.name}/teams/probot/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'admin' })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/orgs/${repository.owner.name}/teams/greenkeeper-keeper/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'push' })
        return true
      })
      .reply(OK)
    githubScope
      .delete(`/orgs/${repository.owner.name}/teams/form8ion/repos/${repository.owner.name}/${repository.name}`)
      .reply(NO_CONTENT)

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
