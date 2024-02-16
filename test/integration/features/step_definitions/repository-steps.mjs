import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import any from '@travi/any'
import assert from 'node:assert'

import { repository } from './common-steps.mjs'
import settings from '../../../../lib/settings.js'

Given('basic repository config is defined', async function () {
  this.repository = {
    name: repository.name,
    description: any.sentence(),
    default_branch: 'main',
    visibility: any.fromList(['public', 'private', 'internal']),
    homepage: any.url()
  }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => HttpResponse.arrayBuffer(Buffer.from(dump({ repository: this.repository })))
    ),
    http.patch(`https://api.github.com/repos/${repository.owner.name}/${repository.name}`, async ({ request }) => {
      this.repositoryDetails = await request.json()

      return new HttpResponse(null, { status: StatusCodes.OK })
    })
  )
})

Then('the repository will be configured', async function () {
  assert.deepEqual(this.repositoryDetails, this.repository)
})
