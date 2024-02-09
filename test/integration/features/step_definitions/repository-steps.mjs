import { When } from '@cucumber/cucumber'
import any from '@travi/any'

export const repository = {
  default_branch: 'master',
  name: 'botland',
  owner: {
    name: 'bkeepers-inc',
    login: 'bkeepers-inc',
    email: null
  }
}

export function buildRepositoryCreatedEvent () {
  return {
    name: 'repository.created',
    payload: { repository }
  }
}

export function buildRepositoryEditedEvent () {
  return {
    name: 'repository.edited',
    payload: {
      changes: { default_branch: { from: any.word() } },
      repository
    }
  }
}

When('the repository is created', async function () {
  await this.probot.receive(buildRepositoryCreatedEvent())
})

When('the repository is edited', async function () {
  await this.probot.receive(buildRepositoryEditedEvent())
})
