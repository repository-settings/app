# github-configurer

This service syncs repository settings defined in `.github/settings.yml` to GitHub. Any changes to this file on the default branch will be synced to the repository.

## Configuration

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
    oldname: Help Wanted # include the old name to rename and existing label

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

## Usage

0. **[Go to the integration](https://github.com/integration/configurer)**, click **Install**, and then select an organization.
0. Create a `.github/settings.yml` file in your repository. See [Configuration](#configuration) for more information.
0. Any configuration changed in `.github/settings.yml` should be reflected on GitHub.

### Deploy your own bot to Heroku

0. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy) - Click this button and pick an **App Name** that Heroku is happy with, like `your-name-probot`. Before you can complete this, you'll need config variables from the next step.
0. In another tab, [create an integration](https://developer.github.com/early-access/integrations/creating-an-integration/) on GitHub, using `https://your-app-name.herokuapp.com/` as the **Homepage URL**, **Callback URL**, and **Webhook URL**. The permissions and events that your bot needs access to will depend on what you use it for.
0. After creating your GitHub integration, go back to the Heroku tab and fill in the configuration variables with the values for the GitHub Integration
0. Create a `.github/settings.yml` file in your repository. See [Configuration](#configuration) for more information.
