# Collaborators

https://docs.github.com/en/rest/collaborators/collaborators

```yaml
collaborators:
  - username: bkeepers
    permission: push
  - username: hubot
    permission: pull

  # Note: `permission` is only valid on organization-owned repositories.
  # The permission to grant the collaborator. Can be one of:
  # * `pull` - can pull, but not push to or administer this repository.
  # * `push` - can pull and push, but not administer this repository.
  # * `admin` - can pull, push and administer this repository.
  # * `maintain` - Recommended for project managers who need to manage the repository without access to sensitive or destructive actions.
  # * `triage` - Recommended for contributors who need to proactively manage issues and pull requests without write access.
```
