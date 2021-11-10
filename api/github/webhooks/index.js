const { createNodeMiddleware, createProbot } = require('probot')

const app = require('../../../')

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks'
})
