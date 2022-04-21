import Settings from '../../../lib/settings'
import { initializeNock, loadInstance, repository, teardownNock } from '../common'

describe('push trigger', function () {
  let probot, githubScope

  beforeEach(() => {
    githubScope = initializeNock()
    probot = loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('does not apply configuration when not on the default branch', async () => {
    await probot.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/wip',
        repository,
        commits: [{ modified: [Settings.FILE_NAME], added: [] }]
      }
    })
  })
})
