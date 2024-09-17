import deepEqual from 'deep-equal'

import Diffable from './diffable.js'

export default class Rulesets extends Diffable {
  async find () {
    const { data: rulesets } = await this.github.repos.getRepoRulesets(this.repo)

    return rulesets
  }

  comparator (existing, attrs) {
    return existing.name === attrs.name
  }

  changed (existing, attrs) {
    return !deepEqual(existing, attrs)
  }

  update (existing, attrs) {
    return this.github.repos.updateRepoRuleset({ ...this.repo, ruleset_id: existing.ruleset_id, ...attrs })
  }

  remove (existing) {
    return this.github.repos.deleteRepoRuleset({ ...this.repo, ruleset_id: existing.ruleset_id })
  }

  async add (attrs) {
    await this.github.repos.createRepoRuleset({ ...this.repo, ...attrs })
  }
}
