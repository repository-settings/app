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
                var actions = []

                this.entries.forEach(attrs => {
                    const existing = existingRecords.find(record => {
                        return this.comparator(record, attrs)
                    })

                    /*
                    if (this.create_issues) {
                      if (!existing || this.changed(existing, attrs)) {
                        issue_attrs.push(attrs)
                      }
                      return
                    }
*/
                    if (!existing) {
                      if (this.create_issues) {
                        actions.push('Add')
                        issue_attrs.push(attrs)

                      }
                      else {
                        changes.push(this.add(attrs))
                      }

                    } else if (this.changed(existing, attrs)) {
                        if (this.create_issues) {
                          actions.push('Update')
                          issue_attrs.push(attrs)
                        }
                        else {
                          changes.push(this.update(existing, attrs))
                        }
                    }
                })

                existingRecords.forEach(x => {
                    if (!this.entries.find(y => this.comparator(x, y))) {
                        if (this.create_issues) {
                          actions.push('Remove')
                          issue_attrs.push(x)
                          return
                        }
                        changes.push(this.remove(x))
                    }
                })

                if (this.create_issues) {
                    this.createIssue(issue_attrs, actions)
                }


                return Promise.all(changes)
            })
        }
    }
}
