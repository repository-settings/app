import { createNodeMiddleware, createProbot } from 'probot'

import app from '../../../index.js'

export default createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks'
})
