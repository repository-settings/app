# Teams

See https://docs.github.com/en/rest/teams/teams#add-or-update-team-repository-permissions for available options

```yaml
teams:
  - name: core
    # The permission to grant the team. Can be one of:
    # * `pull` - can pull, but not push to or administer this repository.
    # * `push` - can pull and push, but not administer this repository.
    # * `admin` - can pull, push and administer this repository.
    # * `maintain` - Recommended for project managers who need to manage the repository without access to sensitive or destructive actions.
    # * `triage` - Recommended for contributors who need to proactively manage issues and pull requests without write access.
    permission: admin
  - name: docs
    permission: push
```
