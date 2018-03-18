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
              // deleting a reference if already present named as probot
              await context.github.gitdata.deleteReference({owner: owner, repo: repoName, ref: 'heads/probot'})
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
                // Encode the String
                const Base64 = {

                  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

                  encode: function (input) {
                    var output = ''
                    var chr1, chr2, chr3, enc1, enc2, enc3, enc4
                    var i = 0

                    input = Base64._utf8_encode(input)

                    while (i < input.length) {
                      chr1 = input.charCodeAt(i++)
                      chr2 = input.charCodeAt(i++)
                      chr3 = input.charCodeAt(i++)

                      enc1 = chr1 >> 2
                      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
                      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
                      enc4 = chr3 & 63

                      if (isNaN(chr2)) {
                        enc3 = enc4 = 64
                      } else if (isNaN(chr3)) {
                        enc4 = 64
                      }

                      output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4)
                    }

                    return output
                  },

                  decode: function (input) {
                    var output = ''
                    var chr1, chr2, chr3
                    var enc1, enc2, enc3, enc4
                    var i = 0

                    input = input.replace(/[^A-Za-z0-9]/g, '')

                    while (i < input.length) {
                      enc1 = this._keyStr.indexOf(input.charAt(i++))
                      enc2 = this._keyStr.indexOf(input.charAt(i++))
                      enc3 = this._keyStr.indexOf(input.charAt(i++))
                      enc4 = this._keyStr.indexOf(input.charAt(i++))

                      chr1 = (enc1 << 2) | (enc2 >> 4)
                      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
                      chr3 = ((enc3 & 3) << 6) | enc4

                      output = output + String.fromCharCode(chr1)

                      if (enc3 !== 64) {
                        output = output + String.fromCharCode(chr2)
                      }
                      if (enc4 !== 64) {
                        output = output + String.fromCharCode(chr3)
                      }
                    }

                    output = Base64._utf8_decode(output)

                    return output
                  },

                  _utf8_encode: function (string) {
                    string = string.replace(/\r\n/g, '\n')
                    var utftext = ''

                    for (var n = 0; n < string.length; n++) {
                      var c = string.charCodeAt(n)

                      if (c < 128) {
                        utftext += String.fromCharCode(c)
                      } else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192)
                        utftext += String.fromCharCode((c & 63) | 128)
                      } else {
                        utftext += String.fromCharCode((c >> 12) | 224)
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128)
                        utftext += String.fromCharCode((c & 63) | 128)
                      }
                    }

                    return utftext
                  },

                  _utf8_decode: function (utftext) {
                    var string = ''
                    var i = 0
                    var c, c2, c3
                    c = c2 = 0

                    while (i < utftext.length) {
                      c = utftext.charCodeAt(i)

                      if (c < 128) {
                        string += String.fromCharCode(c)
                        i++
                      } else if ((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i + 1)
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
                        i += 2
                      } else {
                        c2 = utftext.charCodeAt(i + 1)
                        c3 = utftext.charCodeAt(i + 2)
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
                        i += 3
                      }
                    }

                    return string
                  }

                }

                const encodedString = Base64.encode(string)
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
        if (FILE_NAME !== undefined) {
          return Settings.sync(context.github, repo)
        } else {
          context.log('sorry')
        }
      } catch (error) {
        context.log('sorry wrong path')
      }
    })
  }
}
