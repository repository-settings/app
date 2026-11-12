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

  it('should resolve the team slug of a bypass actor to the actor id', async () => {
    const teamSlug = any.word()
    const teamId = any.integer()
    const unchangedId = any.integer()
    const unchangedName = any.word()
    const newName = any.word()
    const otherActor = { actor_id: any.integer(), actor_type: 'Integration', bypass_mode: 'always' }
    const plugin = configure(github, owner, repo, [
      { name: newName, bypass_actors: [{ team: teamSlug, bypass_mode: 'pull_request' }, otherActor] },
      { name: unchangedName, bypass_actors: [{ team: teamSlug, bypass_mode: 'always' }] }
    ])
    when(github.request)
      .calledWith('GET /orgs/{org}/teams/{team_slug}', { org: owner, team_slug: teamSlug })
      .mockResolvedValue({ data: { id: teamId } })
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets', { owner, repo, includes_parents: false })
      .mockResolvedValue({ data: [{ id: unchangedId, name: unchangedName }] })
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', { owner, repo, ruleset_id: unchangedId })
      .mockResolvedValue({
        data: {
          id: unchangedId,
          name: unchangedName,
          bypass_actors: [{ actor_id: teamId, actor_type: 'Team', bypass_mode: 'always' }]
        }
      })

    await plugin.sync()

    expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/rulesets', {
      owner,
      repo,
      name: newName,
      bypass_actors: [{ actor_id: teamId, actor_type: 'Team', bypass_mode: 'pull_request' }, otherActor]
    })
    expect(github.request).not.toHaveBeenCalledWith(
      'PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}',
      expect.anything()
    )
    expect(github.request.mock.calls.filter(([route]) => route === 'GET /orgs/{org}/teams/{team_slug}')).toHaveLength(1)
  })

  it('should prefer the team slug over an actor id defined next to it', async () => {
    const teamSlug = any.word()
    const teamId = any.integer()
    const name = any.word()
    const staleActor = { actor_id: any.integer(), actor_type: 'Integration' }
    const plugin = configure(github, owner, repo, [
      { name, bypass_actors: [{ team: teamSlug, ...staleActor, bypass_mode: 'always' }] }
    ])
    when(github.request)
      .calledWith('GET /orgs/{org}/teams/{team_slug}', { org: owner, team_slug: teamSlug })
      .mockResolvedValue({ data: { id: teamId } })
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets', { owner, repo, includes_parents: false })
      .mockResolvedValue({ data: [] })

    await plugin.sync()

    expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/rulesets', {
      owner,
      repo,
      name,
      bypass_actors: [{ actor_id: teamId, actor_type: 'Team', bypass_mode: 'always' }]
    })
  })

  it('should default the bypass mode to the api default', async () => {
    const id = any.integer()
    const name = any.word()
    const actor = { actor_id: any.integer(), actor_type: 'Integration' }
    const plugin = configure(github, owner, repo, [{ name, bypass_actors: [actor] }])
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets', { owner, repo, includes_parents: false })
      .mockResolvedValue({ data: [{ id, name }] })
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', { owner, repo, ruleset_id: id })
      .mockResolvedValue({ data: { id, name, bypass_actors: [{ ...actor, bypass_mode: 'always' }] } })

    await plugin.sync()

    expect(github.request).not.toHaveBeenCalledWith(
      'PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}',
      expect.anything()
    )
  })

  it('should sync the other rulesets when a team can not be resolved', async () => {
    const error = new Error('Not Found')
    const failingId = any.integer()
    const removedId = any.integer()
    const failingName = any.word()
    const newRuleset = { name: any.word() }
    const plugin = configure(github, owner, repo, [
      { name: failingName, bypass_actors: [{ team: any.word() }] },
      { name: any.word(), bypass_actors: [{ team: null }] },
      newRuleset
    ])
    const existingRulesets = [
      { id: failingId, name: failingName },
      { id: removedId, name: any.word() }
    ]
    when(github.request)
      .calledWith('GET /orgs/{org}/teams/{team_slug}', expect.anything())
      .mockRejectedValue(error)
    when(github.request)
      .calledWith('GET /repos/{owner}/{repo}/rulesets', { owner, repo, includes_parents: false })
      .mockResolvedValue({ data: existingRulesets })
    existingRulesets.forEach(ruleset => {
      when(github.request)
        .calledWith('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', { owner, repo, ruleset_id: ruleset.id })
        .mockResolvedValue({ data: ruleset })
    })

    await expect(plugin.sync()).rejects.toThrow()

    expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/rulesets', { owner, repo, ...newRuleset })
    expect(github.request).not.toHaveBeenCalledWith(
      'PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}',
      expect.anything()
    )
    expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      owner,
      repo,
      ruleset_id: removedId
    })
  })
})
