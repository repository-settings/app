const { createProbot } = require('probot')
const nock = require('nock')
const debugNock = require('debug')('nock')
const settingsBot = require('../../')

function loadInstance () {
  const probot = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
  probot.load(settingsBot)

  return probot
}

function initializeNock () {
  return nock('https://api.github.com').log(debugNock)
}

function teardownNock (githubScope) {
  expect(githubScope.isDone()).toBe(true)

  nock.cleanAll()
}

module.exports = {
  loadInstance,
  initializeNock,
  teardownNock,
  repository: {
    default_branch: 'master',
    name: 'botland',
    owner: {
      name: 'bkeepers-inc',
      email: null
    }
  }
}
