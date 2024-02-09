import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import any from '@travi/any'
import assert from 'node:assert'

import { repository } from './common-steps.mjs'
import settings from '../../../../lib/settings.js'

Given('no environments are defined', async function () {
  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments`, () => {
      return HttpResponse.json({ environments: [] })
    })
  )
})

Given('an environment is defined in the config', async function () {
  this.environmentName = any.word()

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ environments: [{ name: this.environmentName }] })))
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/:environmentName`,
      async ({ params }) => {
        this.createdEnvironmentName = params.environmentName

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Then('the environment is available', async function () {
  assert.equal(this.createdEnvironmentName, this.environmentName)
})
