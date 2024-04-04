# Environments


See https://docs.github.com/en/rest/deployments/environments#create-or-update-an-environment for available options.

> [!IMPORTANT]
> `deployment_branch_policy` differs from the API for ease of use.
    Either `protected_branches` (boolean) OR `custom_branches` (array of strings) can be provided;
      this will manage the API requirements under the hood.
>
> See https://docs.github.com/en/rest/deployments/branch-policies for documentation of `custom_branches`.
    If both are provided in an unexpected manner, `protected_branches` will be used.
>
> Either removing or simply not setting `deployment_branch_policy` will restore the default 'All branches' setting.

```markdown
environments:
  - name: production
    wait_timer: 5
    reviewers:
      - id: 1
        type: 'Team'
      - id: 2
        type: 'User'
    deployment_branch_policy:
      protected_branches: true
  - name: development
    deployment_branch_policy:
      custom_branches:
        - main
        - dev/*
        - name: release/*
          type: branch
        - name: v*
          type: tag
```
