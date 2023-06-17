const path = require('node:path')
const { promises: fs } = require('node:fs')
const { OK } = require('http-status-codes')
const { Probot, ProbotOctokit } = require('probot')
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

async function defineSettingsFileForScenario (settingsFileFixtureName, githubScope) {
  const pathToConfig = path.resolve(__dirname, '..', 'fixtures', settingsFileFixtureName)
  const configFile = Buffer.from(await fs.readFile(pathToConfig, 'utf8'))
  const config = configFile.toString()

  githubScope
    .get(`/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(settings.FILE_NAME)}`)
    .reply(OK, config)

  return config
}

module.exports = {
  loadInstance,
  initializeNock,
  teardownNock,
  buildTriggerEvent,
  buildRepositoryCreatedEvent,
  buildRepositoryEditedEvent,
  defineSettingsFileForScenario,
  repository
}
