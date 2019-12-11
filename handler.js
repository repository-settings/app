// handler.js
const { serverless } = require('@probot/serverless-lambda')
const appFn = require('./')
module.exports.probot = serverless(appFn)