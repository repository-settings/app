# Configuration

Create a `.github/settings.yml` file in your repository. Changes to this file on the default branch will be synced to GitHub.

## Sections

All sections are optional. Some do have required fields.

Find details about each available section in their own page:

* [Repository](./plugins/repository.md)
* [Teams](./plugins/teams.md)
* [Collaborators](./plugins/collaborators.md)
* [Branches](./plugins/branches.md)
* [Environments](./plugins/environments.md)
* [Labels](./plugins/labels.md)
* [Milestones](./plugins/milestones.md)

### Inheritance

This app is built with [probot](https://github.com/probot/probot), and thus uses the [octokit-plugin-config](https://github.com/probot/octokit-plugin-config).
This means you can inherit settings from another repo, and only override what you want to change.

Individual settings in the arrays listed under `labels`, `teams`, and `branches` will be merged with the base repo if the `name` of an element in the array matches the `name` of an element in the corresponding array in the base repo.
A possible future enhancement would be to make that work for the other settings arrays based on `username`, or `title`.
This is not currently supported.

#### To further clarify:
Inheritance within the Protected Branches plugin allows you to override specific settings per branch.
For example, your `.github` repo may set default protection on the `master` branch.
You can then include `master` in your `branches` array, and only override the `required_approving_review_count`.
Alternatively, you might only have a branch like `develop` in your `branches` array, and would still get `master` protection from your base repo.
