# GitHub Configurer

[![Greenkeeper badge](https://badges.greenkeeper.io/probot/configurer.svg)](https://greenkeeper.io/)

This GitHub Integration syncs repository settings defined in `.github/config.yml` to GitHub, enabling Pull Requests for repository settings.

## Usage

1. **[Install the integration](https://github.com/integration/configurer)**.
2. Create a `.github/config.yml` file in your repository. Changes to this file on the default branch will be synced to GitHub.

All settings are optional.

```yaml
repository:
  # See https://developer.github.com/v3/repos/#edit for all available settings.

  # The name of the repository. Changing this will rename the repository
  name: repo-name

  # A short description of the repository that will show up on GitHub
  description: description of repo

  # A URL with more information about the repository
  homepage: https://example.github.io/

  # Either `true` to make the repository private, or `false` to make it public.
  private: false

  # Either `true` to enable issues for this repository, `false` to disable them.
  has_issues: true

  # Either `true` to enable the wiki for this repository, `false` to disable it.
  has_wiki: true

  # Either `true` to enable downloads for this repository, `false` to disable them.
  has_downloads: true

  # Updates the default branch for this repository.
  default_branch: master

  # Either `true` to allow squash-merging pull requests, or `false` to prevent
  # squash-merging.
  allow_squash_merge: true

  # Either `true` to allow merging pull requests with a merge commit, or `false`
  # to prevent merging pull requests with merge commits.
  allow_merge_commit: true

  # Either `true` to allow rebase-merging pull requests, or `false` to prevent
  # rebase-merging.
  allow_rebase_merge: true

# Labels: define labels for Issues and Pull Requests
labels:
  - name: bug
    color: CC0000
  - name: feature
    color: 336699
  - name: first-timers-only
    # include the old name to rename an existing label
    oldname: Help Wanted

# Collaborators: give specific users access to this repository.
collaborators:
  - username: bkeepers
    # Note: Only valid on organization-owned repositories.
    # The permission to grant the collaborator. Can be one of:
    # * `pull` - can pull, but not push to or administer this repository.
    # * `push` - can pull and push, but not administer this repository.
    # * `admin` - can pull, push and administer this repository.
    permission: push

  - username: hubot
    permission: pull

  - username:
    permission: pull

teams:
  - name: core
    permission: admin
  - name: docs
    permission: push
```

**WARNING:** Note that this integration inherently _escalates anyone with `push` permissions to the **admin** role_, since they can push config settings to the `master` branch, which will be synced. In a future, we may add restrictions to allow changes to the config file to be merged only by specific people/teams, or those with **admin** access _(via a combination of protected branches, required statuses, and branch restrictions)_. Until then, use caution when merging PRs and adding collaborators.

## Deploy your own bot to Heroku

0. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy) - Click this button and pick an **App Name** that Heroku is happy with, like `your-name-probot`. Before you can complete this, you'll need config variables from the next step.
0. In another tab, [create an integration](https://developer.github.com/early-access/integrations/creating-an-integration/) on GitHub, using `https://your-app-name.herokuapp.com/` as the **Homepage URL**, **Callback URL**, and **Webhook URL**, and turn on
  - **Repository administration**: **Read & Write**
  - **Repository contents**: **Read only**, and check the **Push** checkbox
  - **Single file**: **Read & Write** and enter `.github/config.yml`
0. After creating your GitHub integration, go back to the Heroku tab and fill in the configuration variables with the values for the GitHub Integration
0. Create a `.github/config.yml` file in your repository. See [Usage](#usage) for more information.
