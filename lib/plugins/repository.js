module.exports = class Repository {
  constructor(github, repo, settings) {
    this.github = github;
    this.settings = Object.assign({}, settings, repo);
  }

  sync() {
    this.settings.name = this.settings.name || this.settings.repo;
    return this.github.repos.edit(this.settings);
  }
};
