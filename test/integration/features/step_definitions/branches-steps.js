import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import assert from 'node:assert'
import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import any from '@travi/any'

import { repository } from './common-steps.js'
import settings from '../../../../lib/settings.js'

Given('no branch-protection rules are defined for the repository', async function () {
  return undefined
})

Given('a branch-protection rule exists for the repository', async function () {
  this.branchName = any.word()
})

Given('a branch-protection rule is defined in the config', async function () {
  const branchName = any.word()
  this.branchProtectionRule = {
    name: branchName,
    protection: {
      enforce_admins: true
    }
  }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => HttpResponse.arrayBuffer(Buffer.from(dump({ branches: [this.branchProtectionRule] })))
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/branches/${branchName}/protection`,
      async ({ request }) => {
        this.createdProtectionRule = await request.json()

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('the branch-protection rule is modified in the config', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Given('the branch-protection rule is removed from the config', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) =>
        HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              branches: [{ name: this.branchName, protection: {} }]
            })
          )
        )
    ),
    http.delete(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/branches/:branchName/protection`,
      async ({ params }) => {
        console.log({ params })
        this.removedProtectionRuleBranch = params.branchName

        return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
      }
    )
  )
})

Then('the branch-protection rule is enabled for the repository', async function () {
  assert.deepEqual(this.createdProtectionRule, this.branchProtectionRule.protection)
})

Given('no branch-protection updates are made to the config', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Given('multiple branch-protection rules exist for the repository', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Given('all branch-protection rules are removed from the config', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Then('the branch-protection rule is updated', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Then('no branch-protection updates are triggered', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Then('the branch-protection rule is deleted', async function () {
  assert.equal(this.removedProtectionRuleBranch, this.branchName)
})

Then('all branch-protection rules are deleted', async function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})
