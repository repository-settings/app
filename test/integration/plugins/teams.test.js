import fs from 'fs'
import { CREATED, NO_CONTENT, OK } from 'http-status-codes'
import any from '@travi/any'
import Settings from '../../../lib/settings'
import { buildTriggerEvent, initializeNock, loadInstance, repository, teardownNock } from '../common'

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
    const pathToConfig = new URL('../../fixtures/teams-config.yml', import.meta.url)
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const config = configFile.toString()
    const probotTeamId = any.integer()
    const githubTeamId = any.integer()
    const greenkeeperKeeperTeamId = any.integer()
    const formationTeamId = any.integer()
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(OK, config)
    githubScope.get(`/repos/${repository.owner.name}/${repository.name}/teams`).reply(OK, [
      { slug: 'greenkeeper-keeper', id: greenkeeperKeeperTeamId, permission: 'pull' },
      { slug: 'form8ion', id: formationTeamId, permission: 'push' }
    ])
    githubScope.get(`/orgs/${repository.owner.name}/teams/probot`).reply(OK, { id: probotTeamId })
    githubScope.get(`/orgs/${repository.owner.name}/teams/github`).reply(OK, { id: githubTeamId })
    githubScope
      .put(`/teams/${probotTeamId}/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'admin' })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/teams/${githubTeamId}/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'maintain' })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/teams/${greenkeeperKeeperTeamId}/repos/${repository.owner.name}/${repository.name}`, body => {
        expect(body).toMatchObject({ permission: 'push' })
        return true
      })
      .reply(OK)
    githubScope.delete(`/teams/${formationTeamId}/repos/${repository.owner.name}/${repository.name}`).reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
