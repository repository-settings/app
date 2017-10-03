// Base class to make it easy to check for changes to a list of items
//
//     class Thing extends Diffable {
//       find() {
//       }
//
//       comparator(existing, attrs) {
//       }
//
//       changed(existing, attrs) {
//       }
//
//       update(existing, attrs) {
//       }
//
//       add(attrs) {
//       }
//
//       remove(existing) {
//       }
//     }
module.exports = class Diffable {
    constructor(github, repo, entries, create_issues) {
        this.github = github
        this.repo = repo
        this.entries = entries
        this.create_issues = create_issues
    }

    sync() {
        if (this.entries) {
            return this.find().then(existingRecords => {
                const changes = []
                var issue_attrs = []

                this.entries.forEach(attrs => {
                    const existing = existingRecords.find(record => {
                        return this.comparator(record, attrs)
                    })
                    if (this.create_issues) {
                      issue_attrs.push(attrs)
                      return
                    }

                    if (!existing) {
                        changes.push(this.add(attrs))
                    } else if (this.changed(existing, attrs)) {
                        changes.push(this.update(existing, attrs))
                    }
                })

                existingRecords.forEach(x => {
                    if (!this.entries.find(y => this.comparator(x, y))) {
                        if (this.create_issues) {
                          issue_attrs.push(attrs)
                          return
                        }
                        changes.push(this.remove(x))
                    }
                })

                if (this.create_issues) {
                    var issueBody = 'The following github repository configurations should be defined:\n'
                    issue_attrs.forEach(change => {
                        issueBody += change + '\n'
                    })
                    var attrs = {
                        title: 'Improve github settings for the current repository',
                        body: issueBody,
                        // TODO configure defaultAssignee and defaultMilestone in settigs.yml
                        // assignee:
                        // milestone:
                        labels: ['github-settings']
                        // assignees
                    }
                    this.github.issues.create(Object.assign({}, attrs, this.repo))
                }


                return Promise.all(changes)
            })
        }
    }
}
