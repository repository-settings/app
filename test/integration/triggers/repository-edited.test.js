const any = require('@travi/any')
const { initializeNock, loadInstance, teardownNock } = require('../common')

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
})
