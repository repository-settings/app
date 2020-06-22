const path = require('path')
const fs = require('fs')
const { CREATED, NO_CONTENT, OK } = require('http-status-codes')
const any = require('@travi/any')
const settings = require('../../../lib/settings')
const { buildTriggerEvent, initializeNock, loadInstance, repository, teardownNock } = require('../common')

describe('teams plugin', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs teams', async () => {
    const pathToConfig = path.resolve(__dirname, '..', '..', 'fixtures', 'teams-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const encodedConfig = configFile.toString('base64')
    const probotTeamId = any.integer()
    const greenkeeperKeeperTeamId = any.integer()
    const formationTeamId = any.integer()
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${settings.FILE_NAME}`)
      .reply(OK, { content: encodedConfig, name: 'settings.yml', type: 'file' })
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/teams`)
      .reply(
        OK,
        [
          { slug: 'greenkeeper-keeper', id: greenkeeperKeeperTeamId, permission: 'pull' },
          { slug: 'form8ion', id: formationTeamId, permission: 'push' }
        ]
      )
    githubScope
      .get(`/orgs/${repository.owner.name}/teams/probot`)
      .reply(OK, { id: probotTeamId })
    githubScope
      .put(`/teams/${probotTeamId}/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'admin' })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/teams/${greenkeeperKeeperTeamId}/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'push' })
        return true
      })
      .reply(OK)
    githubScope
      .delete(`/teams/${formationTeamId}/repos/${repository.owner.name}/${repository.name}`)
      .reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
