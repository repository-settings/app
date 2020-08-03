const path = require('path')
const fs = require('fs')
const { CREATED, NO_CONTENT, OK } = require('http-status-codes')
const settings = require('../../../lib/settings')
const { buildTriggerEvent, initializeNock, loadInstance, repository, installation, teardownNock } = require('../common')

describe('collaborators plugin', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs collaborators', async () => {
    const pathToConfig = path.resolve(__dirname, '..', '..', 'fixtures', 'collaborators-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const encodedConfig = configFile.toString('base64')
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(settings.FILE_NAME)}`)
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
      .put(`/repos/${repository.owner.name}/${repository.name}/collaborators/octokit-bot`, body => {
        expect(body).toMatchObject({ permission: 'triage' })
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

    await probot.receive(buildTriggerEvent())
  })
})
