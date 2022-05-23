const branchArrayMerge = require('../../../lib/mergeArrayByName')
const YAML = require('js-yaml')

describe('mergeArrayByName', () => {
  it('works', () => {
    const target = [
      {
        name: 'master',
        shouldChange: 'did not change',
        shouldKeep: 'kept'
      },
      {
        name: 'develop'
      }
    ]

    const source = [
      {
        name: 'master',
        shouldChange: 'did change'
      },
      {
        name: 'added'
      }
    ]

    const merged = branchArrayMerge(target, source)

    expect(merged).toEqual([
      {
        name: 'master',
        shouldChange: 'did change',
        shouldKeep: 'kept'
      },
      {
        name: 'develop'
      },
      {
        name: 'added'
      }
    ])
  })

  it('works in a realistic scenario', () => {
    const target = YAML.load(`
  branches:
    - name: master
      protection:
        required_pull_request_reviews:
          required_approving_review_count: 1
          dismiss_stale_reviews: false
          require_code_owner_reviews: true
          dismissal_restrictions: {}
        required_status_checks:
          strict: true
          contexts: []
        enforce_admins: false
        restrictions:
  `)

    const source = YAML.load(`
  branches:
    - name: master
      protection:
        required_pull_request_reviews:
          required_approving_review_count: 2
    `)

    const expected = [
      {
        name: 'master',
        protection: {
          required_pull_request_reviews: {
            required_approving_review_count: 2,
            dismiss_stale_reviews: false,
            require_code_owner_reviews: true,
            dismissal_restrictions: {}
          },
          required_status_checks: { strict: true, contexts: [] },
          enforce_admins: false,
          restrictions: null
        }
      }
    ]

    const merged = branchArrayMerge(target.branches, source.branches)

    expect(merged).toEqual(expected)
  })
})
