const nock = require('nock')
const settings = require('../../lib/settings')
const { initializeNock, loadInstance, repository, teardownNock } = require('./common')

nock.disableNetConnect()

describe('push', function () {
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
        commits: [{ modified: [settings.FILE_NAME], added: [] }]
      }
    })
  })
})
