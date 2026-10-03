import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import assert from 'node:assert'
import any from '@travi/any'

import settings from '../../../../lib/settings.js'

import { repository } from './common-steps.js'

function autolinkFor (keyPrefix) {
  return {
    key_prefix: keyPrefix,
    url_template: `https://jira.example.com/browse/${keyPrefix}<num>`,
    is_alphanumeric: any.boolean()
  }
}

Given('no autolinks exist', async function () {
  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/autolinks`, () =>
      HttpResponse.json([])
    )
  )
})

Given('an autolink exists', async function () {
  this.autolink = { id: any.integer(), ...autolinkFor(`${any.word().toUpperCase()}-`) }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/autolinks`, () =>
      HttpResponse.json([this.autolink])
    )
  )
})

Given('an autolink is added', async function () {
  this.autolink = autolinkFor(`${any.word().toUpperCase()}-`)

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      () => HttpResponse.text(dump({ autolinks: [this.autolink] }))
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/autolinks`,
      async ({ request }) => {
        this.savedAutolink = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('the autolink is updated in the config', async function () {
  const { id, ...configuredAutolink } = this.autolink
  this.autolinkUpdates = { url_template: `https://jira.example.com/projects/${this.autolink.key_prefix}<num>` }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      () => HttpResponse.text(dump({ autolinks: [{ ...configuredAutolink, ...this.autolinkUpdates }] }))
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/autolinks/:autolinkId`,
      async ({ params }) => {
        this.removedAutolinkId = params.autolinkId

        return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
      }
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/autolinks`,
      async ({ request }) => {
        this.savedAutolink = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('the autolink is removed from the config', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      () => HttpResponse.text(dump({ autolinks: [] }))
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/autolinks/:autolinkId`,
      async ({ params }) => {
        this.removedAutolinkId = params.autolinkId

        return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
      }
    )
  )
})

Then('the autolink is available', async function () {
  assert.deepEqual(this.savedAutolink, this.autolink)
})

Then('the updated autolink is available', async function () {
  const { id, ...configuredAutolink } = this.autolink

  assert.equal(Number(this.removedAutolinkId), this.autolink.id)
  assert.deepEqual(this.savedAutolink, { ...configuredAutolink, ...this.autolinkUpdates })
})

Then('the autolink is no longer available', async function () {
  assert.equal(Number(this.removedAutolinkId), this.autolink.id)
})
