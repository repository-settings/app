import deepEqual from 'deep-equal'

import Diffable from './diffable.js'

export default class Rulesets extends Diffable {
  async find () {
    const { data: rulesets } = await this.github.repos.getRepoRulesets({ ...this.repo, includes_parents: false })

    const expandedRulesetsData = await Promise.all(
      rulesets.map(({ id }) => this.github.repos.getRepoRuleset({ ...this.repo, ruleset_id: id }))
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

  update (existing, attrs) {
    return this.github.repos.updateRepoRuleset({ ...this.repo, ruleset_id: existing.id, ...attrs })
  }

  remove (existing) {
    return this.github.repos.deleteRepoRuleset({ ...this.repo, ruleset_id: existing.id })
  }

  async add (attrs) {
    await this.github.repos.createRepoRuleset({ ...this.repo, ...attrs })
  }
}
