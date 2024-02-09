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
Given('a milestone exists', async function () {
  this.milestone = { title: any.word(), description: any.sentence(), state: any.word(), number: any.integer() }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/milestones`, ({ request }) => {
      return HttpResponse.json([this.milestone])
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

Given('the milestone is updated in the config', async function () {
  this.milestoneUpdates = { description: any.sentence(), state: any.word() }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ milestones: [{ ...this.milestone, ...this.milestoneUpdates }] }))
        )
      }
    ),
    http.patch(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/milestones/${this.milestone.number}`,
      async ({ request }) => {
        this.updatedMilestone = await request.json()

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('the milestone is removed from the config', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ milestones: [] })))
      }
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/milestones/:milestoneNumber`,
      async ({ params }) => {
        this.removedMilestoneNumber = params.milestoneNumber

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Then('the milestone is available', async function () {
  assert.deepEqual(this.savedMilestone, this.milestone)
})

Then('updated milestone is available', async function () {
  assert.deepEqual(this.updatedMilestone, {
    number: this.milestone.number,
    title: this.milestone.title,
    ...this.milestoneUpdates
  })
})

Then('the milestone is no longer available', async function () {
  assert.equal(this.removedMilestoneNumber, this.milestone.number)
})
