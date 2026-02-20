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
      request: jest.fn().mockImplementation(() => Promise.resolve())
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
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets', { owner, repo, includes_parents: false })
      .mockResolvedValue({
        data: existingRulesets.map(
          ({ rules, conditions, bypass_actors: bypassActors, ...rulesetListProperties }) => rulesetListProperties
        )
      })
    existingRulesets.forEach(ruleset => {
      when(github.request)
        .calledWith('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', { owner, repo, ruleset_id: ruleset.id })
        .mockResolvedValue({ data: ruleset })
    })

    await plugin.sync()

    expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/rulesets', { owner, repo, ...newRuleset })
    expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      owner,
      repo,
      ruleset_id: existingRulesetId,
      ...existingRuleset,
      rules: [...existingRuleset.rules, additionalRule]
    })
    expect(github.request).not.toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      owner,
      repo,
      ruleset_id: secondExistingRulesetId,
      ...secondExistingRuleset
    })
    expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      owner,
      repo,
      ruleset_id: removedRulesetId
    })
  })
})
