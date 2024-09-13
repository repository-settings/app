import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import assert from 'node:assert'
import { http, HttpResponse } from 'msw'

import { repository } from './common-steps.mjs'
import settings from '../../../../lib/settings.js'
import any from '@travi/any'

Given('no rulesets are defined for the repository', async function () {
  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/rulesets`, ({ request }) =>
      HttpResponse.json([])
    )
  )
})

Given('a ruleset is defined in the config', async function () {
  this.ruleset = { name: any.word() }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => HttpResponse.arrayBuffer(Buffer.from(dump({ rulesets: [this.ruleset] })))
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/rulesets`,
      async ({ request }) => {
        this.createdRuleset = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Then('the ruleset is enabled for the repository', async function () {
  assert.deepEqual(this.createdRuleset, this.ruleset)
})
