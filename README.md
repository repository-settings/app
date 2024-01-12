# GitHub Repository Settings

This GitHub App syncs repository settings defined in `.github/settings.yml` to GitHub, enabling Pull Requests for repository settings.

<!--status-badges start -->

[![Node CI Workflow Status][github-actions-ci-badge]][github-actions-ci-link]
[![Renovate][renovate-badge]][renovate-link]

<!--status-badges end -->

## Table of Contents

* [Usage](#usage)
  * [Install](#install)
    * [Hosted GitHub.com App](#hosted-githubcom-app)
    * [Self-Hosted App](#self-hosted-app)
  * [Configuration](#configuration)
* [Security Implications](#security-implications)

## Usage

### Install

To gain the benefits of the Repository Settings app, it will need to installed
as a GitHub App on your repositories.
First, choose which approach to using the Repository Settings App is most appropriate for you:

#### Hosted GitHub.com App

A hosted version is provided for use with GitHub.com.

__[Install the app](https://github.com/apps/settings)__ on your repositories or
entire organization.

[![Powered by Vercel][vercel-badge]][vercel-link]

#### Self-Hosted App

If you would prefer to self-host your own instance, see the documentation about
[self-hosting](docs/self-host.md) if you would like to run your own instance of this app.

### Configuration

Now that you have the repository settings app installed for your repositories,
see the documentation about [configuration](docs/configuration.md) for details
about updating your repository settings through pull-requests.

## Security Implications

> [!Caution]
> Note that this app inherently _escalates anyone with `push`
> permissions to the __admin__ role_, since they can push config settings to the
> default branch, which will be synced.
> Use caution when merging PRs and adding collaborators.

One way to preserve admin/push permissions is to utilize the
[GitHub CodeOwners feature](https://help.github.com/articles/about-codeowners/)
to set one or more administrative users as the code owner of the
`.github/settings.yml` file, and turn on "require code owner review" for the
default branch.
This does have the side effect of requiring code owner review for the entire
branch, but helps preserve permission levels.

[github-actions-ci-link]: https://github.com/repository-settings/app/actions?query=workflow%3A%22Node.js+CI%22+branch%3Amaster

[github-actions-ci-badge]: https://github.com/repository-settings/app/workflows/Node.js%20CI/badge.svg

[renovate-link]: https://renovatebot.com

[renovate-badge]: https://img.shields.io/badge/renovate-enabled-brightgreen.svg?logo=renovatebot

[vercel-badge]: https://github.com/repository-settings/app/raw/master/assets/powered-by-vercel.svg

[vercel-link]: https://vercel.com?utm_source=repository-settings&utm_campaign=oss
