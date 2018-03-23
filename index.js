module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', receive)

  async function receive (context) {
    const payload = context.payload
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    if (defaultBranch && settingsModified) {
      return Settings.sync(context.github, context.repo())
    } else if (!settingsModified) {
      const getRepo = await context.github.repos.get({owner: context.repo().owner, repo: context.repo().repo})
      const repoInfo = await context.github.repos.getContent({owner: context.repo().owner, repo: context.repo().repo, path: '.github/settings.yml'})
      const sha = repoInfo.data.sha
      const jsyml = require('./json2yaml')
      const base64 = require('./encode')
      const result = base64.decode(repoInfo.data.content)
      const yaml = require('js-yaml')
      const doc = yaml.safeLoad(result)
      const topicsMeta = await context.github.repos.getTopics({owner: context.repo().owner, repo: context.repo().repo})
      const topics = topicsMeta.data.names
      if (doc) {
        if (doc.repository) {
          if (doc.repository.name && doc.repository.name !== getRepo.data.name) {
            doc.repository.name = getRepo.data.name
          }
          if ((doc.repository.description) && (doc.repository.description !== getRepo.data.description)) {
            doc.repository.description = getRepo.data.description
          }
          if ((doc.repository.homepage) && (doc.repository.homepage !== getRepo.data.homepage)) {
            doc.repository.homepage = getRepo.data.homepage
          }
          if (doc.repository.topics) {
            doc.repository.topics = topics.toString()
          }
          if ((doc.repository.private) && (doc.repository.private !== getRepo.data.private)) {
            doc.repository.private = getRepo.data.private
          }
          if ((doc.repository.has_issues) && (doc.repository.has_issues !== getRepo.data.has_issues)) {
            doc.repository.has_issues = getRepo.data.has_issues
          }
          if ((doc.repository.has_projects) && (doc.repository.has_projects !== getRepo.data.has_projects)) {
            doc.repository.has_projects = getRepo.data.has_projects
          }
          if ((doc.repository.homepage) && (doc.repository.homepage !== getRepo.data.homepage)) {
            doc.repository.homepage = getRepo.data.homepage
          }
          if ((doc.repository.has_wiki) && (doc.repository.has_wiki !== getRepo.data.has_wiki)) {
            doc.repository.has_wiki = getRepo.data.has_wiki
          }
          if ((doc.repository.has_downloads) && (doc.repository.has_downloads !== getRepo.data.has_downloads)) {
            doc.repository.has_downloads = getRepo.data.has_downloads
          }
          if ((doc.repository.default_branch) && (doc.repository.default_branch !== getRepo.data.default_branch)) {
            doc.repository.default_branch = getRepo.data.default_branch
          }
          if ((doc.repository.allow_squash_merge) && (doc.repository.allow_squash_merge !== getRepo.data.allow_squash_merge)) {
            doc.repository.allow_squash_merge = getRepo.data.allow_squash_merge
          }
          if ((doc.repository.allow_merge_commit) && (doc.repository.allow_merge_commit !== getRepo.data.allow_merge_commit)) {
            doc.repository.allow_merge_commit = getRepo.data.allow_merge_commit
          }
          if ((doc.repository.allow_rebase_merge) && (doc.repository.allow_rebase_merge !== getRepo.data.allow_rebase_merge)) {
            doc.repository.allow_rebase_merge = getRepo.data.allow_rebase_merge
          }
        }
      }
      const yamltest = jsyml.json2yaml(doc)
      const converted = base64.encode(yamltest)
      await context.github.repos.updateFile({owner: context.repo().owner, repo: context.repo().repo, path: '.github/settings.yml', message: 'changed settings.yml according to UI changes', content: converted, sha: sha})
    }
  }
}
