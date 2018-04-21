async function deleteRef (context) {
  if (context.payload.pull_request.head.ref === 'probot') {
    await context.github.gitdata.deleteReference(context.repo({ref: 'heads/probot'}))
  }
}

module.exports = deleteRef
