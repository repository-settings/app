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
        getRepoRulesets: jest.fn(),
        updateRepoRuleset: jest.fn()
      }
    }
  })

  it('should sync rulesets', async () => {
    const updatedValue = any.word()
    const existingRulesetId = any.integer()
    const existingRuleset = { name: any.word(), foo: updatedValue }
    const newRuleset = { name: any.word() }
    const plugin = configure(github, owner, repo, [newRuleset, existingRuleset])
    when(github.repos.getRepoRulesets)
      .calledWith({ owner, repo })
      .mockResolvedValue({ data: [{ ruleset_id: existingRulesetId, ...existingRuleset, foo: any.word() }] })

    await plugin.sync()

    expect(github.repos.createRepoRuleset).toHaveBeenCalledWith({ owner, repo, ...newRuleset })
    expect(github.repos.updateRepoRuleset).toHaveBeenCalledWith({
      owner,
      repo,
      ruleset_id: existingRulesetId,
      ...existingRuleset,
      foo: updatedValue
    })
  })
})
