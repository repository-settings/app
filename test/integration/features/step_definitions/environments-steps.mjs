import { dump } from 'js-yaml'
import { StatusCodes } from 'http-status-codes'

import { Given, Then } from '@cucumber/cucumber'
import { http, HttpResponse } from 'msw'
import any from '@travi/any'
import assert from 'node:assert'

import { repository } from './common-steps.mjs'
import settings from '../../../../lib/settings.js'

const possibleReviewerTypes = ['User', 'Team']

function anyReviewer () {
  return { id: any.integer(), type: any.fromList(possibleReviewerTypes) }
}

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

Given('an environment exists without wait-timer defined', async function () {
  this.environment = { name: any.word(), deployment_branch_policy: null }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments`, () => {
      return HttpResponse.json({ environments: [this.environment] })
    })
  )
})

Given('an environment exists with reviewers defined', async function () {
  this.environment = {
    name: any.word(),
    wait_timer: any.integer(),
    deployment_branch_policy: null,
    reviewers: any.listOf(anyReviewer)
  }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments`, () => {
      return HttpResponse.json({ environments: [this.environment] })
    })
  )
})

Given('an environment exists with a {string} branches deployment branch policy', async function (policyType) {
  this.environment = {
    name: any.word(),
    wait_timer: any.integer(),
    deployment_branch_policy: {
      protected_branches: policyType === 'protected',
      custom_branch_policies: policyType === 'custom'
    }
  }

  this.server.use(
    http.get(`https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments`, () => {
      return HttpResponse.json({ environments: [this.environment] })
    })
  )

  if (policyType === 'custom') {
    this.customBranches = any.listOf(() => ({ name: any.word(), id: any.integer() }))
    this.removedDeploymentBranchPolicyIds = {}

    this.server.use(
      http.get(
        `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}/deployment-branch-policies`,
        () => {
          return HttpResponse.json({ branch_policies: this.customBranches })
        }
      ),
      http.delete(
        `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}/deployment-branch-policies/:id`,
        ({ params }) => {
          this.removedDeploymentBranchPolicyIds[params.id] = true

          return new HttpResponse(null, { status: StatusCodes.NO_CONTENT })
        }
      )
    )
  }
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

Given('an environment is defined in the config with reviewers', async function () {
  this.environmentName = any.word()
  this.reviewers = any.listOf(anyReviewer)

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ environments: [{ name: this.environmentName, reviewers: this.reviewers }] }))
        )
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

Given('wait-timer is not defined for the environment in the config', async function () {
  const { wait_timer: waitTimer, ...environmentWithoutWaitTimer } = this.environment

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [environmentWithoutWaitTimer]
            })
          )
        )
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

        return new HttpResponse(null, { status: StatusCodes.OK })
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

Given('a reviewer has its type changed', async function () {
  const [reviewerToBeUpdated, ...unchangedReviewers] = this.environment.reviewers
  const alternativeType = possibleReviewerTypes.find(type => type !== reviewerToBeUpdated.type)
  this.updatedReviewer = { ...reviewerToBeUpdated, type: alternativeType }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [{ ...this.environment, reviewers: [...unchangedReviewers, this.updatedReviewer] }]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.updatedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('a reviewer has its id changed', async function () {
  const [reviewerToBeUpdated, ...unchangedReviewers] = this.environment.reviewers
  this.updatedReviewer = { ...reviewerToBeUpdated, id: any.integer() }

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [{ ...this.environment, reviewers: [...unchangedReviewers, this.updatedReviewer] }]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.updatedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('a reviewer is added to the environment', async function () {
  this.addedReviewer = anyReviewer()

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [{ ...this.environment, reviewers: [this.addedReviewer] }]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.updatedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('a reviewer is removed from the environment in the config', async function () {
  const [removedReviewer, ...remainingReviewers] = this.environment.reviewers
  this.removedReviewer = removedReviewer

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [{ ...this.environment, reviewers: remainingReviewers }]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.updatedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('an environment is defined in the config with a protected branches deployment branch policy', async function () {
  this.environmentName = any.word()

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [
                {
                  name: this.environmentName,
                  deployment_branch_policy: { protected_branches: true }
                }
              ]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environmentName}`,
      async ({ request }) => {
        this.savedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('an environment is defined in the config with a custom branches deployment branch policy', async function () {
  this.environmentName = any.word()
  this.customBranchNames = any.listOf(any.word)
  this.createdDeploymentBranchPolicyNames = {}

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [
                {
                  name: this.environmentName,
                  deployment_branch_policy: { protected_branches: false, custom_branches: this.customBranchNames }
                }
              ]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environmentName}`,
      async ({ request }) => {
        this.savedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environmentName}/deployment-branch-policies`,
      async ({ request }) => {
        const policyName = (await request.json()).name
        this.createdDeploymentBranchPolicyNames[policyName] = true

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('a protected deployment branch policy is defined for the environment', async function () {
  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [
                {
                  ...this.environment,
                  deployment_branch_policy: { protected_branches: true }
                }
              ]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.savedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    )
  )
})

Given('a custom deployment branch policy is defined for the environment', async function () {
  this.customBranchNames = any.listOf(any.word)
  this.createdDeploymentBranchPolicyNames = {}

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(
            dump({
              environments: [
                {
                  ...this.environment,
                  deployment_branch_policy: { protected_branches: false, custom_branches: this.customBranchNames }
                }
              ]
            })
          )
        )
      }
    ),
    http.put(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}`,
      async ({ request }) => {
        this.savedEnvironment = await request.json()

        return new HttpResponse(null, { status: StatusCodes.CREATED })
      }
    ),
    http.post(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/environments/${this.environment.name}/deployment-branch-policies`,
      async ({ request }) => {
        const policyName = (await request.json()).name
        this.createdDeploymentBranchPolicyNames[policyName] = true

        return new HttpResponse(null, { status: StatusCodes.OK })
      }
    )
  )
})

Given('an environment is defined in the config with the same reviewers but sorted differently', async function () {
  const ascendingIdSortedReviewers = this.environment.reviewers.sort((a, b) => a.id - b.id)

  this.server.use(
    http.get(
      `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
        settings.FILE_NAME
      )}`,
      ({ request }) => {
        return HttpResponse.arrayBuffer(
          Buffer.from(dump({ environments: [{ ...this.environment, reviewers: ascendingIdSortedReviewers }] }))
        )
      }
    )
  )
})

Given(
  'an environment is defined in the config with the same custom branches deployment branch policy but sorted differently',
  async function () {
    this.server.use(
      http.get(
        `https://api.github.com/repos/${repository.owner.name}/${repository.name}/contents/${encodeURIComponent(
          settings.FILE_NAME
        )}`,
        ({ request }) => {
          return HttpResponse.arrayBuffer(
            Buffer.from(
              dump({
                environments: [
                  {
                    ...this.environment,
                    deployment_branch_policy: {
                      protected_branches: false,
                      custom_branches: this.customBranches.map(branch => branch.name).reverse()
                    }
                  }
                ]
              })
            )
          )
        }
      )
    )
  }
)

Then('the environment is available', async function () {
  assert.deepEqual(this.createdEnvironment, { deployment_branch_policy: null })
})

Then('the environment is available with reviewers', async function () {
  assert.deepEqual(this.createdEnvironment, { deployment_branch_policy: null, reviewers: this.reviewers })
})

Then('the environment is updated', async function () {
  assert.deepEqual(this.updatedEnvironment, this.environmentUpdates)
})

Then('the environment is no longer available', async function () {
  assert.equal(this.removedEnvironment, this.environment.name)
})

Then('the reviewer type is updated', async function () {
  assert.equal(this.updatedEnvironment.reviewers.length, this.environment.reviewers.length)
  assert.deepEqual(
    this.updatedEnvironment.reviewers.find(reviewer => reviewer.id === this.updatedReviewer.id).type,
    this.updatedReviewer.type
  )
})

Then('the reviewer id is updated', async function () {
  assert.equal(this.updatedEnvironment.reviewers.length, this.environment.reviewers.length)
  assert.deepEqual(
    this.updatedEnvironment.reviewers.find(reviewer => reviewer.id === this.updatedReviewer.id),
    this.updatedReviewer
  )
})

Then('the reviewer is defined for the environment', async function () {
  assert.deepEqual(this.updatedEnvironment.reviewers, [this.addedReviewer])
})

Then('the reviewer is removed from the environment', async function () {
  assert.equal(this.updatedEnvironment.reviewers.length, this.environment.reviewers.length - 1)
  assert.equal(
    this.updatedEnvironment.reviewers.find(reviewer => reviewer.id === this.removedReviewer.id),
    undefined
  )
})

Then('the environment is available with a protected branches deployment branch policy', async function () {
  assert.deepEqual(this.savedEnvironment, {
    deployment_branch_policy: { protected_branches: true, custom_branch_policies: false }
  })
})

Then('the protected branches deployment branch policy is available for the environment', async function () {
  const { name, deployment_branch_policy: policy, ...existingEnvironment } = this.environment

  assert.deepEqual(this.savedEnvironment, {
    ...existingEnvironment,
    deployment_branch_policy: { protected_branches: true, custom_branch_policies: false }
  })
})

Then('the environment is available with a custom branches deployment branch policy', async function () {
  assert.deepEqual(this.savedEnvironment, {
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
  })
  assert.deepEqual(this.customBranchNames, Object.keys(this.createdDeploymentBranchPolicyNames))
})

Then('the custom branches deployment branch policy is available for the environment', async function () {
  const { name, deployment_branch_policy: policy, ...existingEnvironment } = this.environment

  assert.deepEqual(this.savedEnvironment, {
    ...existingEnvironment,
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
  })
  assert.deepEqual(this.customBranchNames.sort(), Object.keys(this.createdDeploymentBranchPolicyNames))
})

Then('custom deployment branch policies are removed', async function () {
  assert.deepEqual(
    Object.keys(this.removedDeploymentBranchPolicyIds),
    this.customBranches.map(branch => branch.id)
  )
})

Then('no update will happen', async function () {
  // absence of an error means no update calls were made
  return undefined
})
