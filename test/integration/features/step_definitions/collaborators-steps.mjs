import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import assert from 'node:assert'
import { http, HttpResponse } from 'msw'
import any from '@travi/any'

import settings from '../../../../lib/settings.js'

import { repository } from './common-steps.mjs'

const collaboratorLogin = any.word()

Given('no collaborator has been granted access to the repository', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/collaborators`,
      ({ request }) => {
        const url = new URL(request.url)
        const collaboratorAffiliation = url.searchParams.get('affiliation')

        if (collaboratorAffiliation === 'direct') {
          return HttpResponse.json([])
        }
      }
    )
  )
})

Given('a collaborator has been granted {string} privileges to the repository', async function (accessLevel) {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/collaborators`,
      ({ request }) => {
        const url = new URL(request.url)
        const collaboratorAffiliation = url.searchParams.get('affiliation')

        if (collaboratorAffiliation === 'direct') {
          return HttpResponse.json([{ login: collaboratorLogin, permissions: { [accessLevel]: true } }])
        }
      }
    )
  )
})

Given('a collaborator is granted {string} privileges in the config', async function (accessLevel) {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ collaborators: [{ username: collaboratorLogin, permission: accessLevel }] }))
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/collaborators/${collaboratorLogin}`,
      async ({ request }) => {
        this.collaboratorPermissionLevel = (await request.json()).permission

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('the collaborator privileges are updated to {string} in the config', async function (accessLevel) {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ collaborators: [{ username: collaboratorLogin, permission: accessLevel }] }))
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/collaborators/${collaboratorLogin}`,
      async ({ request }) => {
        this.collaboratorPermissionLevel = (await request.json()).permission

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('the collaborator privileges are removed in the config', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(Buffer.from(dump({ collaborators: [] })))
      }
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/collaborators/:collaboratorLogin`,
      async ({ params }) => {
        this.removedCollaboratorLogin = params.collaboratorLogin

        return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
      }
    )
  )
})

Then('the collaborator has {string} access granted to it', async function (accessLevel) {
  assert.equal(this.collaboratorPermissionLevel, accessLevel)
})

Then('the collaborator has privileges to the repo revoked', async function () {
  assert.equal(this.removedCollaboratorLogin, collaboratorLogin)
})
