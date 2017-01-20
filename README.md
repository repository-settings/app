# github-repo-settings

This service syncs repository settings defined in `.github/settings.yml` to GitHub. Any changes to this file on the default branch will be synced to the repository.

```yaml
repository:
  description: name of repo that shows up on GitHub
  homepage: https://example.github.io/
  private: false
  default_branch: master
  allow_rebase_merge: true
  allow_squash_merge: true
  allow_merge_commit: true
  has_issues: true
  has_downloads: true
  has_wiki: true

labels:
  - name: bug
    color: CC0000
  - name: feature
    color: 336699
  - name: first-timers-only
    oldName: Help Wanted # include the old name to rename and existing label

collaborators:
  - username: bkeepers
    permission: push # pull, push, admin
  - username: hubot
    permission: pull

## Note: none of these are implemented yet

teams:
  - name: engineers
    permission: admin
  - name: project-managers
    permission: push
  - name: bosses
    permission: pull

milestones:
  - title: v1
    description: description of milestone
    state: open # or: closed
    due_on: YYYY-MM-DDTHH:MM:SSZ

hooks:
  - config: A Hash containing key/value pairs to provide settings for this hook. These settings vary between the services and are defined in the github-services repo. Booleans are stored internally as `1` for true, and `0` for false. Any JSON true/false values will be converted automatically.
    events: =["push"]]  Determines what events the hook is triggered for. Default: `['push']`.
    active: true

protected_branches:
  - name: branch-name
    required_statuses: [continuous-integration/jenkins]
    teams: [team1, team2]
    users: [person1, person2]
```
