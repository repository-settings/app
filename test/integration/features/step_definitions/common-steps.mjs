import { Probot, ProbotOctokit } from 'probot'

import any from '@travi/any'
import { Before, When } from '@cucumber/cucumber'
import settingsBot from '../../../../index.js'
import { buildRepositoryCreatedEvent, buildRepositoryEditedEvent } from './repository-events-steps.mjs'
import { buildPushEvent } from './config-steps.mjs'

export const repository = {
  default_branch: 'master',
  name: 'botland',
  owner: {
    name: 'bkeepers-inc',
    login: 'bkeepers-inc',
    email: null
  }
}

async function loadInstance () {
  const probot = new Probot({
    appId: 1,
    privateKey: 'test',
    githubToken: 'test',
    Octokit: ProbotOctokit.defaults(instanceOptions => ({
      ...instanceOptions,
      retry: { enabled: false },
      throttle: { enabled: false }
    }))
  })
  await probot.load(settingsBot)

  return probot
}

function buildTriggerEvent () {
  return any.fromList([buildPushEvent(), buildRepositoryCreatedEvent(), buildRepositoryEditedEvent()])
}

Before(async function () {
  this.probot = await loadInstance()
})

When('a settings sync is triggered', async function () {
  await this.probot.receive(buildTriggerEvent())
})
