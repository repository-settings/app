import any from '@travi/any'
import { Before, When } from '@cucumber/cucumber'

import settings from '../../../../lib/settings.js'
import { Probot, ProbotOctokit } from 'probot'
import settingsBot from '../../../../index.js'

let probot

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
    Octokit: ProbotOctokit.defaults({
      retry: { enabled: false },
      throttle: { enabled: false }
    })
  })
  await probot.load(settingsBot)

  return probot
}

function buildPushEvent () {
  return {
    name: 'push',
    payload: {
      ref: 'refs/heads/master',
      repository,
      commits: [{ modified: [settings.FILE_NAME], added: [] }]
    }
  }
}

function buildRepositoryEditedEvent () {
  return {
    name: 'repository.edited',
    payload: {
      changes: { default_branch: { from: any.word() } },
      repository
    }
  }
}

function buildRepositoryCreatedEvent () {
  return {
    name: 'repository.created',
    payload: { repository }
  }
}

function buildTriggerEvent () {
  return any.fromList([buildPushEvent(), buildRepositoryCreatedEvent(), buildRepositoryEditedEvent()])
}

Before(async function () {
  probot = await loadInstance()
})

When('a settings sync is triggered', async function () {
  await probot.receive(buildTriggerEvent())
})
