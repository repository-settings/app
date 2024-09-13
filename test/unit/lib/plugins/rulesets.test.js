import { jest } from '@jest/globals'
import { when } from 'jest-when'
import any from '@travi/any'

import Rulesets from '../../../../lib/plugins/rulesets'

function configure (github, owner, repo, config) {
  return new Rulesets(github, { owner, repo }, config)
}

describe('rulesets', () => {
  let github
  const owner = any.word()
  const repo = any.word()

  beforeEach(() => {
    github = {
      repos: {
        createRepoRuleset: jest.fn(),
        getRepoRulesets: jest.fn()
      }
    }
  })

  it('should sync rulesets', async () => {
    const newRuleset = { name: any.word() }
    const plugin = configure(github, owner, repo, [newRuleset])
    when(github.repos.getRepoRulesets)
      .calledWith({ owner, repo })
      .mockResolvedValue([])

    await plugin.sync()

    expect(github.repos.createRepoRuleset).toHaveBeenCalledWith({ owner, repo, ...newRuleset })
  })
})
