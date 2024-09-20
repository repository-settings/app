# Repository Rulesets

> [!WARNING]
> Support for Repository Rulesets is still under development.
> Details may still change, like how the configuration is defined in the `settings.yml`.
> Please follow [#732](https://github.com/repository-settings/app/issues/732) for progress updates.
> Feedback is appreciated, but adopt cautiously, with the expectation of breaking changes until support is fully released.

See https://docs.github.com/en/rest/repos/rules#update-a-repository-ruleset for
all available ruleset properties and a description of each.

```yaml
rulesets:
  - name: prevent destruction of the default branch
    target: branch
    enforcement: active
    conditions:
      ref_name:
        include:
          - "~DEFAULT_BRANCH"
        exclude: []
    rules:
      - type: deletion
      - type: non_fast_forward

  - name: verification must pass
    target: branch
    enforcement: active
    conditions:
      ref_name:
        include:
          - "~DEFAULT_BRANCH"
        exclude: []
    rules:
      - type: required_status_checks
        parameters:
          required_status_checks:
            - context: test
              integration_id: 123456
    bypass_actors:
      - actor_id: 5
        actor_type: RepositoryRole
        bypass_mode: pull_request

  - name: changes must be reviewed
    target: branch
    enforcement: active
    conditions:
      ref_name:
        include:
          - "~DEFAULT_BRANCH"
        exclude: []
    rules:
      - type: pull_request
        parameters:
          required_approving_review_count: 1
          require_code_owner_review: true
    bypass_actors:
      - actor_id: 654321
        actor_type: Integration
        bypass_mode: always
```
