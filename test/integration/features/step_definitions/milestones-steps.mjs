import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import assert from 'node:assert'
import any from '@travi/any'

import settings from '../../../../lib/settings.js'
import { repository } from './common-steps.mjs'

Given('no milestones exist', async function () {
  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/milestones`, ({ request }) => {
      return HttpResponse.json([])
    })
  )
})

Given('a milestone is added', async function () {
  this.milestone = { title: any.word(), description: any.sentence(), state: any.word() }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ milestones: [this.milestone] })))
      }
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/milestones`,
      async ({ request }) => {
        this.savedMilestone = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Then('the milestone is available', async function () {
  assert.deepEqual(this.savedMilestone, this.milestone)
})
