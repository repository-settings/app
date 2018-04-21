module.exports = getRepo => `
  repository:
    name: ${getRepo.data.name}
    description: ${getRepo.data.description}
    homepage: ${getRepo.data.homepage}
    topics: github, probot
    private: ${getRepo.data.private}
    has_issues: ${getRepo.data.has_issues}
    has_projects: ${getRepo.data.has_projects}
    has_wiki: ${getRepo.data.has_wiki}
    has_downloads: ${getRepo.data.has_downloads}
    default_branch: ${getRepo.data.default_branch}
    allow_squash_merge: ${getRepo.data.allow_squash_merge}
    allow_merge_commit: ${getRepo.data.allow_merge_commit}
    allow_rebase_merge: ${getRepo.data.allow_rebase_merge}

  labels:
    - name: bug
      color: CC0000
    - name: feature
      color: 336699
    - name: first-timers-only
      oldname: bug

  collaborators:
    - username: enter any username
      permission: push
`
