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

Given('an environment exists', async function () {
  this.environment = { name: any.word(), wait_timer: any.integer(), deployment_branch_policy: null }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments`, () => {
      return HttpResponse.json({ environments: [this.environment] })
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
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environmentName}`,
      async ({ params, request }) => {
        this.createdEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('the environment is modified in the config', async function () {
  this.environmentUpdates = { wait_timer: any.integer(), deployment_branch_policy: null }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [{ name: this.environment.name, ...this.environmentUpdates }]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.updatedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('the environment is removed from the config', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ environments: [] })))
      }
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/:environmentName`,
      async ({ params }) => {
        this.removedEnvironment = params.environmentName

        return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
      }
    )
  )
})

Then('the environment is available', async function () {
  assert.deepEqual(this.createdEnvironment, { deployment_branch_policy: null })
})

Then('the environment is updated', async function () {
  assert.deepEqual(this.updatedEnvironment, this.environmentUpdates)
})

Then('the environment is no longer available', async function () {
  assert.equal(this.removedEnvironment, this.environment.name)
})
