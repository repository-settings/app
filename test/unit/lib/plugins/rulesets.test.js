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
        deleteRepoRuleset: jest.fn(),
        getRepoRuleset: jest.fn(),
        getRepoRulesets: jest.fn(),
        updateRepoRuleset: jest.fn()
      }
    }
  })

  it('should sync rulesets', async () => {
    const additionalRule = any.simpleObject()
    const existingRulesetId = any.integer()
    const secondExistingRulesetId = any.integer()
    const removedRulesetId = any.integer()
    const existingRuleset = { name: any.word(), rules: [any.simpleObject()] }
    const secondExistingRuleset = { name: any.word(), rules: [any.simpleObject()] }
    const newRuleset = { name: any.word() }
    const plugin = configure(github, owner, repo, [
      newRuleset,
      { ...existingRuleset, rules: [...existingRuleset.rules, additionalRule] },
      secondExistingRuleset
    ])
    const existingRulesets = [
      { id: existingRulesetId, ...existingRuleset },
      { id: secondExistingRulesetId, ...secondExistingRuleset },
      { id: removedRulesetId, name: any.word() }
    ]
    when(github.repos.getRepoRulesets)
      .calledWith({ owner, repo, includes_parents: false })
      .mockResolvedValue({
        data: existingRulesets.map(
          ({ rules, conditions, bypass_actors: bypassActors, ...rulesetListProperties }) => rulesetListProperties
        )
      })
    existingRulesets.forEach(ruleset => {
      when(github.repos.getRepoRuleset)
        .calledWith({ owner, repo, ruleset_id: ruleset.id })
        .mockResolvedValue({ data: ruleset })
    })

    await plugin.sync()

    expect(github.repos.createRepoRuleset).toHaveBeenCalledWith({ owner, repo, ...newRuleset })
    expect(github.repos.updateRepoRuleset).toHaveBeenCalledWith({
      owner,
      repo,
      ruleset_id: existingRulesetId,
      ...existingRuleset,
      rules: [...existingRuleset.rules, additionalRule]
    })
    expect(github.repos.updateRepoRuleset).not.toHaveBeenCalledWith({
      owner,
      repo,
      ruleset_id: secondExistingRulesetId,
      ...secondExistingRuleset
    })
    expect(github.repos.deleteRepoRuleset).toHaveBeenCalledWith({ owner, repo, ruleset_id: removedRulesetId })
  })
})
