import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import any from '@travi/any'
import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import assert from 'node:assert'

import settings from '../../../../lib/settings.js'

import { repository } from './common-steps.mjs'

Given('no labels exist', async function () {
  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/labels`, ({ request }) => {
      return HttpResponse.json([])
    })
  )
})

Given('a label exists', async function () {
  this.label = { name: any.word(), color: any.word() }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/labels`, ({ request }) => {
      return HttpResponse.json([this.label])
    })
  )
})

Given('a label is added', async function () {
  this.label = { name: any.word(), color: any.word() }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ labels: [this.label] })))
      }
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/labels`,
      async ({ request }) => {
        this.savedLabel = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('a label is added with a leading `#` on the color code', async function () {
  this.label = { name: any.word(), color: any.word() }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ labels: [{ ...this.label, color: `#${this.label.color}` }] }))
        )
      }
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/labels`,
      async ({ request }) => {
        this.savedLabel = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('the color is updated on the existing label', async function () {
  this.newColor = any.word()

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ labels: [{ name: this.label.name, color: this.newColor }] }))
        )
      }
    ),
    http.patch(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/labels/${this.label.name}`,
      async ({ request }) => {
        this.updatedColor = (await request.json()).color

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('the label is removed from the config', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ labels: [] })))
      }
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/labels/:labelName`,
      async ({ params }) => {
        this.removedLabel = params.labelName

        return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
      }
    )
  )
})

Then('the label is available', async function () {
  assert.deepEqual(this.savedLabel, this.label)
})

Then('the label has the updated color', async function () {
  assert.equal(this.updatedColor, this.newColor)
})

Then('the label is no longer available', async function () {
  assert.deepEqual(this.removedLabel, this.label.name)
})
