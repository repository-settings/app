import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'
import assert from 'node:assert'

import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import any from '@travi/any'

import { repository } from './common-steps.mjs'
import settings from '../../../../lib/settings.js'

Given('no team has been granted access to the repository', async function () {
  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/teams`, ({ request }) => {
      return HttpResponse.json([])
    })
  )
})

Given('a team is granted {string} privileges in the config', async function (accessLevel) {
  const teamName = any.word()
  const teamId = any.integer()

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ teams: [{ name: teamName, permission: accessLevel }] })))
      }
    ),
    http.get(`https://api.github.com/orgs/${repository.owner.name}/teams/${teamName}`, ({ request }) => {
      return HttpResponse.json({ id: teamId })
    }),
    http.put(
      `https://api.github.com/teams/${teamId}/repos/${repository.owner.name}/${repository.name}`,
      async ({ request }) => {
        this.teamPermissionLevel = (await request.json()).permission

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Then('the team has {string} access granted to it', async function (accessLevel) {
  assert.equal(this.teamPermissionLevel, accessLevel)
})
