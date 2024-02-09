import { Given, When } from '@cucumber/cucumber'
import any from '@travi/any'

import { repository } from './common-steps.mjs'

export function buildRepositoryCreatedEvent () {
  return {
    name: 'repository.created',
    payload: { repository }
  }
}

export function buildRepositoryEditedEvent ({ changes } = {}) {
  return {
    name: 'repository.edited',
    payload: {
      changes: { ...(changes || { default_branch: { from: any.word() } }) },
      repository
    }
  }
}

Given('the default branch is not changed as part of updating the repository', async function () {
  this.repositoryEditedChanges = any.simpleObject()
})

When('the repository is created', async function () {
  await this.probot.receive(buildRepositoryCreatedEvent())
})

When('the repository is edited', async function () {
  await this.probot.receive(buildRepositoryEditedEvent({ changes: this.repositoryEditedChanges }))
})
