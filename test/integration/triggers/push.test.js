const settings = require('../../../lib/settings')
const { initializeNock, loadInstance, repository, teardownNock } = require('../common')

describe('push trigger', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
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
        commits: [{ modified: [settings.FILE_NAME], added: [] }]
      }
    })
  })
})
