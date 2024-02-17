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

Given('topics are defined in the repository config', async function () {
  this.repository = {
    name: repository.name,
    topics: any.listOf(any.word).join(', ')
  }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => HttpResponse.arrayBuffer(Buffer.from(dump({ repository: this.repository })))
    ),
    http.patch(`https://api.github.com/repos/${repository.owner.name}/${repository.name}`, async ({ request }) => {
      return new HttpResponse(null, { status: StatusCodes.OK })
    }),
    http.put(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/topics`, async ({ request }) => {
      this.updatedTopics = (await request.json()).names

      return new HttpResponse(null, { status: StatusCodes.OK })
    })
  )
})

Given('vulnerability alerts are {string} in the config', async function (enablement) {
  this.repository = {
    name: repository.name,
    enable_vulnerability_alerts: enablement === 'enabled'
  }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => HttpResponse.arrayBuffer(Buffer.from(dump({ repository: this.repository })))
    ),
    http.patch(`https://api.github.com/repos/${repository.owner.name}/${repository.name}`, async ({ request }) => {
      return new HttpResponse(null, { status: StatusCodes.OK })
    }),
    http[this.repository.enable_vulnerability_alerts ? 'put' : 'delete'](
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/vulnerability-alerts`,
      async ({ request }) => {
        this.vulnerabilityAlertEnablement = enablement

        return new HttpResponse(null, {
          status: this.repository.enable_vulnerability_alerts ? StatusCodes.OK : StatusCodes.NO_CONTENT
        })
      }
    )
  )
})

Given('security fixes are {string} in the config', async function (enablement) {
  this.repository = {
    name: repository.name,
    enable_automated_security_fixes: enablement === 'enabled'
  }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => HttpResponse.arrayBuffer(Buffer.from(dump({ repository: this.repository })))
    ),
    http.patch(`https://api.github.com/repos/${repository.owner.name}/${repository.name}`, async ({ request }) => {
      return new HttpResponse(null, { status: StatusCodes.OK })
    }),
    http[this.repository.enable_automated_security_fixes ? 'put' : 'delete'](
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/automated-security-fixes`,
      async ({ request }) => {
        this.securityFixesEnablement = enablement

        return new HttpResponse(null, {
          status: this.repository.enable_automated_security_fixes ? StatusCodes.OK : StatusCodes.NO_CONTENT
        })
      }
    )
  )
})

Then('the repository will be configured', async function () {
  assert.deepEqual(this.repositoryDetails, this.repository)
})

Then('topics are updated', async function () {
  assert.deepEqual(this.updatedTopics, this.repository.topics.split(', '))
})

Then('vulnerability alerts are {string}', async function (enablement) {
  assert.equal(this.vulnerabilityAlertEnablement, enablement)
})

Then('security fixes are {string}', async function (enablement) {
  assert.equal(this.securityFixesEnablement, enablement)
})
