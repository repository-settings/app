const repos = require('probot-repos')

async function installSync (context, Settings) {
  repos(context).then((val) => {
    val.forEach(async function (value) {
      const owner = value.owner
      const repoName = value.repo
      // As context.repo() was undefined so had to convert it into object
      const repo = {
        owner: owner,
        repo: repoName
      }
      // repo should have a .github folder
      const path = '.github'
      try {
        const repoInfo = await context.github.repos.getContent({owner: owner, repo: repoName, path: path})
        const FILE_NAME = repoInfo.data.find(file => {
          if (file.name === 'settings.yml') {
            return file.name
          } else {
            try {
              const reference = context.github.gitdata.getReference({owner: owner, repo: repoName, ref: 'heads/master'})
              const refData = reference.data
              const sha = refData.object.sha
              try {
                const getRepo = context.github.repos.get({owner: owner, repo: repoName})

                context.github.gitdata.createReference({owner: owner, repo: repoName, ref: 'refs/heads/probot', sha: sha})
                // setting the template of file
                const template = require('./template')
                const string = template(getRepo)

                const encodedString = Buffer.from(string).toString('base64')
                // creating a file
                context.github.repos.createFile({owner: owner, repo: repoName, path: '.github/settings.yml', message: 'adding settings.yml file', content: encodedString, branch: 'probot'})
                // creating pull request
                context.github.pullRequests.create({owner: owner, repo: repoName, head: 'probot', base: 'master', title: 'Settings Bot adding config file', body: 'Merge it to configure the bot'})
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
        try {
          const reference = await context.github.gitdata.getReference({owner: owner, repo: repoName, ref: 'heads/master'})
          const refData = await reference.data
          const sha = await refData.object.sha
          try {
            const getRepo = await context.github.repos.get({owner: owner, repo: repoName})

            await context.github.gitdata.createReference({owner: owner, repo: repoName, ref: 'refs/heads/probot', sha: sha})
            // setting the template of file
            const template = require('./template')
            const string = template(getRepo)

            const encodedString = Buffer.from(string).toString('base64')
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
  })
}

module.exports = installSync
