const Settings = require('../../lib/settings')

const mockPlugin = {
  sync: jest.fn().mockImplementation(() => Promise.resolve({}))
}

class MockPlugin {
  constructor () {
    return mockPlugin
  }
}

describe('Settings', () => {
  let context

  beforeEach(() => {
    context = {
      github: {
        repos: {
          getContent: jest.fn().mockImplementation(() => Promise.resolve({}))
        }
      },
      repo: jest.fn().mockImplementation(() => Promise.resolve({}))
    }

    Settings.PLUGINS = {
      plugin: MockPlugin
    }
  })

  describe('sync', () => {
    it('syncs plugins', async () => {
      await Settings.sync(context, () => {
        return Promise.resolve({
          plugin: {}
        })
      })

      expect(mockPlugin.sync).toHaveBeenCalled()
    })
  })
})
