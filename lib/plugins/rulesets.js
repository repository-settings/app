import Diffable from './diffable.js'

export default class Rulesets extends Diffable {
  async find () {
    await this.github.repos.getRepoRulesets(this.repo)

    return []
  }

  async add (attrs) {
    await this.github.repos.createRepoRuleset({ ...this.repo, ...attrs })
  }
}
