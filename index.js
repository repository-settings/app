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
    }
  }

  robot.on('installation_repositories.added', installSync)

  async function installSync (context) {
    const payload = context.payload
    // getting all the repos that are adding
    const repoAddedId = await payload.repositories_added
    const repoAddedIds = []
    repoAddedId.forEach(async function (value) {
      await repoAddedIds.push(value.id)
    })
    repoAddedIds.forEach(async function (value) {
      const result = await context.github.repos.getById({id: value})
      const owner = result.data.owner.login
      const repoName = result.data.name
      // As context.repo() was undefined so had to convert it into object
      const repo = {
        owner: owner,
        repo: repoName
      }
      // repo should have a .github folder
      const path = '.github'
      try {
        const repoInfo = await context.github.repos.getContent({owner: owner, repo: repoName, path: path})

        const FILE_NAME = repoInfo.data.find(async file => {
          if (file.name === 'settings.yml') {
            return file.name
          } else {
            try {
              const reference = await context.github.gitdata.getReference({owner: owner, repo: repoName, ref: 'heads/master'})
              const refData = reference.data
              const sha = refData.object.sha
              try {
                await context.github.gitdata.createReference({owner: owner, repo: repoName, ref: 'refs/heads/probot', sha: sha})
                // setting the template of file
                const string = 'repository: \n' +
                              '  name: repo-name \n' +
                              '  description: description of repo \n' +
                              '  homepage: www.google.com \n' +
                              '  topics: github, probot \n' +
                              '  private: true \n' +
                              '  has_issues: true \n' +
                              '  has_projects: true \n' +
                              '  has_wiki: true \n' +
                              '  has_downloads: true \n' +
                              '  default_branch: master \n' +
                              '  allow_squash_merge: true \n' +
                              '  allow_merge_commit: true \n' +
                              '  allow_rebase_merge: true \n\n' +
                              'labels: \n' +
                              '  - name: bug \n' +
                              '    color: CC0000 \n' +
                              '  - name: feature \n' +
                              '    color: 336699 \n' +
                              '  - name: first-timers-only \n' +
                              '    oldname: bug \n\n' +
                              'collaborators: \n' +
                              '  - username: your username \n' +
                              '    permission: push'

                const base64 = require('./encode')
                const encodedString = base64.encode(string)
                // creating a file
                await context.github.repos.createFile({owner: owner, repo: repoName, path: '.github/settings.yml', message: 'adding settings.yml file', content: encodedString, branch: 'probot'})
                // creating pull request
                await context.github.pullRequests.create({owner: owner, repo: repoName, head: 'probot', base: 'master', title: 'Settings Bot adding config file', body: 'Merge it to configure the bot'})
              } catch (error) {
                context.log(error)
              }
            } catch (error) {
              context.log(error)
            }
          }
        })
        // syncying the file if present
        if (FILE_NAME.name === 'settings.yml') {
          return Settings.sync(context.github, repo)
        } else {
          context.log('file not found so creating a pull request')
        }
      } catch (error) {
        context.log('Wrong path create a .github folder')
      }
    })
  }
}
