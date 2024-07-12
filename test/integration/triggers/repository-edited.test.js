import { NOT_FOUND } from 'http-status-codes'
import any from '@travi/any'
import Settings from '../../../lib/settings'
import { buildRepositoryEditedEvent, initializeNock, loadInstance, repository, teardownNock } from '../common'

describe('repository.edited trigger', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
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
      .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(NOT_FOUND, {
        message: 'Not Found',
        documentation_url: 'https://developer.github.com/v3/repos/contents/#get-contents'
      })
    githubScope
      .get(`/repos/${repository.owner.name}/.github/contents/${encodeURIComponent(Settings.FILE_NAME)}`)
      .reply(NOT_FOUND, {
        message: 'Not Found',
        documentation_url: 'https://developer.github.com/v3/repos/contents/#get-contents'
      })

    await probot.receive(buildRepositoryEditedEvent())
  })
})
