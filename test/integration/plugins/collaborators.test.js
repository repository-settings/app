import fs from 'fs'
import { CREATED, NO_CONTENT, OK } from 'http-status-codes'
import Settings from '../../../lib/settings'
import { buildTriggerEvent, initializeNock, loadInstance, repository, teardownNock } from '../common'

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
    const pathToConfig = new URL('../../fixtures/collaborators-config.yml', import.meta.url)
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const config = configFile.toString()
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(OK, config)
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
