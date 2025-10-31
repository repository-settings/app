import { jest } from '@jest/globals'
import { when } from 'jest-when'

import Collaborators from '../../../../lib/plugins/collaborators'

describe('Collaborators', () => {
  let github
  const repoOwner = 'bkeepers'
  const repoName = 'test'

  function configure (config) {
    return new Collaborators(github, { owner: repoOwner, repo: repoName }, config)
  }

  beforeEach(() => {
    github = { request: jest.fn().mockImplementation(() => Promise.resolve()) }
  })

  describe('sync', () => {
    it('syncs collaborators', () => {
      const plugin = configure([
        { username: 'bkeepers', permission: 'admin' },
        { username: 'added-user', permission: 'push' },
        { username: 'updated-permission', permission: 'push' },
        { username: 'DIFFERENTcase', permission: 'push' }
      ])

      when(github.request)
        .calledWith('GET /repos/{owner}/{repo}/collaborators', {
          repo: repoName,
          owner: repoOwner,
          affiliation: 'direct'
        })
        .mockResolvedValue({
          data: [
            { login: 'bkeepers', permissions: { admin: true, push: true, pull: true } },
            { login: 'updated-permission', permissions: { admin: false, push: false, pull: true } },
            { login: 'removed-user', permissions: { admin: false, push: true, pull: true } },
            { login: 'differentCase', permissions: { admin: false, push: true, pull: true } }
          ]
        })

      return plugin.sync().then(() => {
        expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/collaborators/{username}', {
          owner: 'bkeepers',
          repo: 'test',
          username: 'added-user',
          permission: 'push'
        })

        expect(github.request).toHaveBeenCalledWith('PUT /repos/{owner}/{repo}/collaborators/{username}', {
          owner: 'bkeepers',
          repo: 'test',
          username: 'updated-permission',
          permission: 'push'
        })

        expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/collaborators/{username}', {
          owner: 'bkeepers',
          repo: 'test',
          username: 'removed-user'
        })
      })
    })
  })
})
