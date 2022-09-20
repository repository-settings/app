const { NOT_FOUND } = require('http-status-codes')
const any = require('@travi/any')
const settings = require('../../../lib/settings')
const { buildRepositoryEditedEvent, initializeNock, loadInstance, repository, teardownNock } = require('../common')

describe('repository.edited trigger', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('does not apply configuration when the default branch was not changed', async () => {
    await probot.receive({
      name: 'repository.edited',
      payload: {
        changes: any.simpleObject()
      }
    })
  })

  it('does not apply configuration when the repository does not have a settings.yml', async () => {
    githubScope
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(settings.FILE_NAME)}`)
      .reply(NOT_FOUND, {
        message: 'Not Found',
        documentation_url: 'https://developer.github.com/v3/repos/contents/#get-contents'
      })
    githubScope
      .get(`/repos/${repository.owner.name}/.github/contents/${encodeURIComponent(settings.FILE_NAME)}`)
      .reply(NOT_FOUND, {
        message: 'Not Found',
        documentation_url: 'https://developer.github.com/v3/repos/contents/#get-contents'
      })

    await probot.receive(buildRepositoryEditedEvent())
  })
})
