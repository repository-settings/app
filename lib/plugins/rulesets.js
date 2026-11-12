import deepEqual from 'deep-equal'

import Diffable from './diffable.js'
import findTeam from '../findTeam.js'

export default class Rulesets extends Diffable {
  constructor (...args) {
    super(...args)

    this.teamIds = new Map()
  }

  async sync () {
    if (this.entries) {
      this.entries = await Promise.all(
        this.entries.map(ruleset =>
          // Keep the entry so the existing ruleset is not removed.
          this.withActorIds(ruleset).catch(error => ({ name: ruleset.name, error }))
        )
      )
    }

    return super.sync()
  }

  async withActorIds (ruleset) {
    const { bypass_actors: bypassActors } = ruleset

    if (!bypassActors) return ruleset

    return {
      ...ruleset,
      bypass_actors: await Promise.all(
        bypassActors.map(async ({ team, ...rest }) => {
          const actor = { bypass_mode: 'always', ...rest }

          if (team === undefined) return actor
          if (!team) throw new Error(`A bypass actor of the ruleset "${ruleset.name}" has an empty team`)

          return { ...actor, actor_id: await this.teamId(team), actor_type: 'Team' }
        })
      )
    }
  }

  teamId (slug) {
    if (!this.teamIds.has(slug)) {
      this.teamIds.set(
        slug,
        findTeam(this.github, this.repo.owner, slug).then(({ id }) => id)
      )
    }

    return this.teamIds.get(slug)
  }

  async find () {
    const { data: rulesets } = await this.github.request('GET /repos/{owner}/{repo}/rulesets', {
      ...this.repo,
      includes_parents: false
    })

    const expandedRulesetsData = await Promise.all(
      rulesets.map(({ id }) =>
        this.github.request('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', { ...this.repo, ruleset_id: id })
      )
    )

    return expandedRulesetsData.map(({ data }) => data)
  }

  comparator (existing, attrs) {
    return existing.name === attrs.name
  }

  changed (existing, attrs) {
    const {
      id,
      _links,
      created_at: createdAt,
      updated_at: updatedAd,
      source_type: sourceType,
      source,
      node_id: nodeId,
      current_user_can_bypass: currentUserCanBypass,
      ...existingAttrs
    } = existing

    return !deepEqual(existingAttrs, attrs)
  }

  async update (existing, { error, ...attrs }) {
    if (error) throw error

    return this.github.request('PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      ...this.repo,
      ruleset_id: existing.id,
      ...attrs
    })
  }

  remove (existing) {
    return this.github.request('DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      ...this.repo,
      ruleset_id: existing.id
    })
  }

  async add ({ error, ...attrs }) {
    if (error) throw error

    await this.github.request('POST /repos/{owner}/{repo}/rulesets', { ...this.repo, ...attrs })
  }
}
