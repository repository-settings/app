const mergeArrayByName = require('./lib/mergeArrayByName')

module.exports = (robot, _, Settings = require('./lib/settings')) => {
  robot.on('push', async context => {
    const payload = context.payload
    const defaultBranch = payload.ref === 'refs/heads/' + payload.repository.default_branch

    const config = await context.config('settings.yml', {}, { arrayMerge: mergeArrayByName })

    const settingsModified = payload.commits.find(commit => {
      return commit.added.includes(Settings.FILE_NAME) ||
        commit.modified.includes(Settings.FILE_NAME)
    })

    console.log('-- -- before get code owners')
    return context.github.repos.getContents({
      owner: context.repo().owner,
      repo: context.repo().repo,
      path: 'CODEOWNERS'
    })
      .then(result => {
        // content will be base64 encoded
        const content = Buffer.from(result.data.content, 'base64').toString()
        const lines = content.split('\n')
        const teamWithOrg = lines[0].split(' ')[1]
        const org = teamWithOrg.split('/')[0].split('@')[1]
        const teamName = teamWithOrg.split('/')[1]
        
        console.log('-- -- codeowners content: ')
        console.log(content)
        
        return context.github.teams.getByName({
          org: org,
          team_slug: teamName
        })
      })
      .then(result => {
        // console.log(`---- team: ${JSON.stringify(team)}`)
        return {
          team_id: result.data.id,
          owner: context.repo().owner,
          repo: context.repo().repo,
          permission: 'push'
        }
      })
      .then(params => {
        return context.github.teams.addOrUpdateRepo(params)
      })

    // if (defaultBranch && settingsModified) {
    //   return Settings.sync(context.github, context.repo(), config)
    // }
  })
}

