import { NOT_FOUND } from 'http-status-codes'
import Settings from '../../../lib/settings'
import { buildRepositoryCreatedEvent, initializeNock, loadInstance, repository, teardownNock } from '../common'

describe('repository.created trigger', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('does not apply configuration when the repository has neither a settings.yml nor a settings.yaml', async () => {
    for (const fileName of Settings.FILE_NAMES) {
      githubScope
        .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(fileName)}`)
        .reply(NOT_FOUND, {
          message: 'Not Found',
          documentation_url: 'https://developer.github.com/v3/repos/contents/#get-contents'
        })
      githubScope
        .get(`/repos/${repository.owner.name}/.github/contents/${encodeURIComponent(fileName)}`)
        .reply(NOT_FOUND, {
          message: 'Not Found',
          documentation_url: 'https://developer.github.com/v3/repos/contents/#get-contents'
        })
    }

    await probot.receive(buildRepositoryCreatedEvent())
  })
})
