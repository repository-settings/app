import { Probot } from 'probot'
import nock from 'nock'
import any from '@travi/any'
import settingsBot from '../../index'
import settings from '../../lib/settings'

nock.disableNetConnect()

const repository = {
  default_branch: 'master',
  name: 'botland',
  owner: {
    name: 'bkeepers-inc',
    login: 'bkeepers-inc',
    email: null
  }
}

function loadInstance () {
  const probot = new Probot({ appId: 1, privateKey: 'test', githubToken: 'test' })
  probot.load(settingsBot)

  return probot
}

function initializeNock () {
  return nock('https://api.github.com')
}

function teardownNock (githubScope) {
  expect(githubScope.pendingMocks()).toStrictEqual([])

  nock.cleanAll()
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

export {
  loadInstance,
  initializeNock,
  teardownNock,
  buildTriggerEvent,
  buildRepositoryCreatedEvent,
  buildRepositoryEditedEvent,
  repository
}
