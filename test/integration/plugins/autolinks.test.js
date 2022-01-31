const path = require('path')
const fs = require('fs')
const { CREATED, NO_CONTENT, OK } = require('http-status-codes')
const settings = require('../../../lib/settings')
const { buildTriggerEvent, initializeNock, loadInstance, repository, teardownNock } = require('../common')

describe('autolinks plugin', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs autolinks', async () => {
    const pathToConfig = path.resolve(__dirname, '..', '..', 'fixtures', 'autolinks-config.yml')
    const configFile = Buffer.from(fs.readFileSync(pathToConfig, 'utf8'))
    const config = configFile.toString()
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(settings.FILE_NAME)}`)
      .reply(OK, config)
    githubScope
      .patch(`/repos/${repository.owner.name}/${repository.name}`)
      .reply(200)
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/autolinks?per_page=100`)
      .reply(
        OK,
        [
          {
            id: 1,
            key_prefix: 'ASDF-',
            url_template: 'https://jira.company.com/browse/ASDF-<num>'
          },
          {
            id: 2,
            key_prefix: 'TEST-',
            url_template: 'https://jira.company.com/browse/TEST-<num>'
          }
        ]
      )
    githubScope
      .post(`/repos/${repository.owner.name}/${repository.name}/autolinks`, body => {
        expect(body).toMatchObject({
          key_prefix: 'BOLIGRAFO-',
          url_template: 'https://jira.company.com/browse/BOLIGRAFO-<num>'
        })
        return true
      })
      .reply(CREATED)
    githubScope
      .delete(`/repos/${repository.owner.name}/${repository.name}/autolinks/2`)
      .reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
