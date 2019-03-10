# GitHub Settings

This GitHub App syncs repository settings defined in `.github/settings.yml` to GitHub, enabling Pull Requests for repository settings.

## Usage

1. **[Install the app](https://github.com/apps/settings)**.
2. Create a `.github/settings.yml` file in your repository. Changes to this file on the default branch will be synced to GitHub.

All top-level settings are optional. Some plugins do have required fields.

```yaml
# These settings are synced to GitHub by https://probot.github.io/apps/settings/

repository:
  # See https://developer.github.com/v3/repos/#edit for all available settings.

  # The name of the repository. Changing this will rename the repository
  name: repo-name

  # A short description of the repository that will show up on GitHub
  description: description of repo

  # A URL with more information about the repository
  homepage: https://example.github.io/

  # A comma-separated list of topics to set on the repository
  topics: github, probot

  # Either `true` to make the repository private, or `false` to make it public.
  private: false

  # Either `true` to enable issues for this repository, `false` to disable them.
  has_issues: true

  # Either `true` to enable projects for this repository, or `false` to disable them.
  # If projects are disabled for the organization, passing `true` will cause an API error.
  has_projects: true

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
    description: An issue with the system 🐛.
    
  - name: feature
    color: 336699
    description: New functionality.
    
  - name: first-timers-only
    # include the old name to rename an existing label
    oldname: Help Wanted

# Milestones: define milestones for Issues and Pull Requests
milestones:
  - title: milestone-title
    description: milestone-description
    # The state of the milestone. Either `open` or `closed`
    state: open

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

# NOTE: The APIs needed for teams are not supported yet by GitHub Apps
# https://developer.github.com/v3/apps/available-endpoints/
teams:
  - name: core
    permission: admin
  - name: docs
    permission: push

branches:
  - name: master
    # https://developer.github.com/v3/repos/branches/#update-branch-protection
    # Branch Protection settings. Set to null to disable
    protection:
      # Required. Require at least one approving review on a pull request, before merging. Set to null to disable.
      required_pull_request_reviews:
        # The number of approvals required. (1-6)
        required_approving_review_count: 1
        # Dismiss approved reviews automatically when a new commit is pushed.
        dismiss_stale_reviews: true
        # Blocks merge until code owners have reviewed.
        require_code_owner_reviews: true
        # Specify which users and teams can dismiss pull request reviews. Pass an empty dismissal_restrictions object to disable. User and team dismissal_restrictions are only available for organization-owned repositories. Omit this parameter for personal repositories.
        dismissal_restrictions:
          users: []
          teams: []
      # Required. Require status checks to pass before merging. Set to null to disable
      required_status_checks:
        # Required. Require branches to be up to date before merging.
        strict: true
        # Required. The list of status checks to require in order to merge into this branch
        contexts: []
      # Required. Enforce all configured restrictions for administrators. Set to true to enforce required status checks for repository administrators. Set to null to disable.
      enforce_admins: true
      # Required. Restrict who can push to this branch. Team and user restrictions are only available for organization-owned repositories. Set to null to disable.
      restrictions:
        users: []
        teams: []
```

### Inheritance

This app uses [probot-config](https://github.com/probot/probot-config). This means you can inherit settings from another repo, and only override what you want to change.

Individual settings in the arrays listed under `labels`, `teams` (once it is supported) and `branches` will be merged with the base repo if the `name` of an element in the array matches the `name` of an element in the corresponding array in the base repo. A possible future enhancement would be to make that work for the other settings arrays based on `username`, or `title`. This is not currently supported. 

To further clarify: Inheritance within the Protected Branches plugin allows you to override specific settings per branch. For example, your `.github` repo may set default protection on the `master` branch. You can then include `master` in your `branches` array, and only override the `required_approving_review_count`.
Alternatively, you might only have a branch like `develop` in your `branches` array, and would still get `master` protection from your base repo.

**WARNING:** Note that this app inherently _escalates anyone with `push` permissions to the **admin** role_, since they can push config settings to the `master` branch, which will be synced. In a future, we may add restrictions to allow changes to the config file to be merged only by specific people/teams, or those with **admin** access _(via a combination of protected branches, required statuses, and branch restrictions)_. Until then, use caution when merging PRs and adding collaborators.

Until restrictions are added in this app, one way to preserve admin/push permissions is to utilize the [GitHub CodeOwners feature](https://help.github.com/articles/about-codeowners/) to set one or more administrative users as the code owner of the `.github/settings.yml` file, and turn on "require code owner review" for the master branch. This does have the side effect of requiring code owner review for the entire branch, but helps preserve permission levels.

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this plugin.
