const { CREATED, NO_CONTENT, OK } = require('http-status-codes')
const {
  buildTriggerEvent,
  initializeNock,
  loadInstance,
  repository,
  teardownNock,
  defineSettingsFileForScenario
} = require('../common')

describe('environments plugin', function () {
  let probot, githubScope

  beforeEach(async () => {
    githubScope = initializeNock()
    probot = await loadInstance()
  })

  afterEach(() => {
    teardownNock(githubScope)
  })

  it('syncs environments', async () => {
    await defineSettingsFileForScenario('environments-config.yml', githubScope)
    githubScope.get(`/repos/${repository.owner.name}/${repository.name}/environments`).reply(OK, {
      environments: [
        { name: 'changed-wait-timer', wait_timer: 1 },
        {
          name: 'changed-reviewers-type',
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'changed-reviewers-id',
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'changed-reviewers-remove',
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'changed-reviewers-add',
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'changed-deployment-branch-policy',
          deployment_branch_policy: { protected_branches: true, custom_branch_policies: false }
        },
        { name: 'changed-all', wait_timer: 0 },
        { name: 'unchanged-default-wait-timer', wait_timer: 0 },
        { name: 'unchanged-wait-timer', wait_timer: 1 },
        {
          name: 'unchanged-reviewers-unsorted',
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'unchanged-reviewers-sorted',
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ]
        },
        {
          name: 'unchanged-deployment-branch-policy',
          deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
        },
        { name: 'deleted', wait_timer: 0 }
      ]
    })
    githubScope
      .get(
        `/repos/${repository.owner.name}/${repository.name}/environments/unchanged-deployment-branch-policy/deployment-branch-policies`
      )
      .reply(OK, {
        branch_policies: [
          {
            id: 1,
            node_id: '1',
            name: 'dev/*'
          },
          {
            id: 2,
            node_id: '2',
            name: 'dev-*'
          }
        ]
      })
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-wait-timer`, body => {
        expect(body).toMatchObject({ wait_timer: 10 })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-reviewers-type`, body => {
        expect(body).toMatchObject({
          reviewers: [
            { id: 1, type: 'User' },
            { id: 2, type: 'User' }
          ]
        })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-reviewers-id`, body => {
        expect(body).toMatchObject({
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 3, type: 'User' }
          ]
        })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-reviewers-remove`, body => {
        expect(body).toMatchObject({ reviewers: [{ id: 1, type: 'Team' }] })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-reviewers-add`, body => {
        expect(body).toMatchObject({
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' },
            { id: 3, type: 'User' }
          ]
        })
        return true
      })
      .reply(CREATED)
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-deployment-branch-policy`, body => {
        expect(body).toMatchObject({
          deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
        })
        return true
      })
      .reply(CREATED)
    githubScope
      .post(
        `/repos/${repository.owner.name}/${repository.name}/environments/changed-deployment-branch-policy/deployment-branch-policies`,
        body => {
          expect(body).toMatchObject({ name: 'stage/*' })
          return true
        }
      )
      .reply(OK, { id: 3, node_id: '3', name: 'stage/*' })
    githubScope
      .post(
        `/repos/${repository.owner.name}/${repository.name}/environments/changed-deployment-branch-policy/deployment-branch-policies`,
        body => {
          expect(body).toMatchObject({ name: 'uat/*' })
          return true
        }
      )
      .reply(OK, { id: 4, node_id: '4', name: 'uat/*' })
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/changed-all`, body => {
        expect(body).toMatchObject({
          wait_timer: 10,
          reviewers: [{ id: 2, type: 'User' }],
          deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
        })
        return true
      })
      .reply(CREATED)
    githubScope
      .post(
        `/repos/${repository.owner.name}/${repository.name}/environments/changed-all/deployment-branch-policies`,
        body => {
          expect(body).toMatchObject({ name: 'dev/*' })
          return true
        }
      )
      .reply(OK, { id: 5, node_id: '5', name: 'dev/*' })
    githubScope
      .put(`/repos/${repository.owner.name}/${repository.name}/environments/new-environment`, body => {
        expect(body).toMatchObject({
          wait_timer: 1,
          reviewers: [
            { id: 1, type: 'Team' },
            { id: 2, type: 'User' }
          ],
          deployment_branch_policy: { protected_branches: true, custom_branch_policies: false }
        })
        return true
      })
      .reply(CREATED)
    githubScope.delete(`/repos/${repository.owner.name}/${repository.name}/environments/deleted`).reply(NO_CONTENT)

    await probot.receive(buildTriggerEvent())
  })
})
