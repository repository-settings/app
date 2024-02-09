import { Given, Then, When } from '@cucumber/cucumber'

import settings from '../../../../lib/settings.js'
import any from '@travi/any'
import { http, HttpResponse } from 'msw'
import { StatusCodes } from 'http-status-codes'
import { repository } from './common-steps.mjs'

export function buildPushEvent ({ pushBranch } = {}) {
  return {
    name: 'push',
    payload: {
      ref: `refs/heads/${pushBranch || repository.default_branch}`,
      repository,
      commits: [{ modified: [settings.FILE_NAME], added: [] }]
    }
  }
}

Given('the repository has no settings file', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return new HttpResponse(null, { status: StatusCodes.NOT_FOUND })
      }
    ),
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/.github/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return new HttpResponse(null, { status: StatusCodes.NOT_FOUND })
      }
    )
  )
})

Given('changes to the settings file are to be pushed to a non-default branch', async function () {
  this.pushBranch = any.word()
})

When('the settings file changes are pushed', async function () {
  await this.probot.receive(buildPushEvent({ pushBranch: this.pushBranch }))
})

Then('a sync does not get triggered', async function () {
  // a call to an unexpected endpoint will error, so lack of an error satisfies this step

  return undefined
})
