const { Probot } = require('probot')
const nock = require('nock')
const any = require('@travi/any')
const settingsBot = require('../../index')
const settings = require('../../lib/settings')

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

async function loadInstance () {
  const probot = new Probot({ appId: 1, privateKey: 'test', githubToken: 'test' })
  await probot.load(settingsBot)

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

module.exports = {
  loadInstance,
  initializeNock,
  teardownNock,
  buildTriggerEvent,
  buildRepositoryCreatedEvent,
  buildRepositoryEditedEvent,
  repository
}
