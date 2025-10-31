import { jest } from '@jest/globals'
import { when } from 'jest-when'

import Milestones from '../../../../lib/plugins/milestones'

describe('Milestones', () => {
  let github
  const repoOwner = 'bkeepers'
  const repoName = 'test'

  function configure (config) {
    return new Milestones(github, { owner: repoOwner, repo: repoName }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn().mockImplementation(() => Promise.resolve()),
      paginate: jest.fn().mockImplementation(() => Promise.resolve())
    }
  })

  describe('sync', () => {
    it('syncs milestones', async () => {
      when(github.paginate)
        .calledWith('GET /repos/{owner}/{repo}/milestones', {
          per_page: 100,
          state: 'all',
          owner: repoOwner,
          repo: repoName
        })
        .mockResolvedValue([
          { title: 'no-change', description: 'no-change-description', due_on: null, state: 'open', number: 5 },
          { title: 'new-description', description: 'old-description', due_on: null, state: 'open', number: 2 },
          { title: 'new-state', description: 'FF0000', due_on: null, state: 'open', number: 4 },
          { title: 'remove-milestone', description: 'old-description', due_on: null, state: 'open', number: 1 }
        ])

      const plugin = configure([
        { title: 'no-change', description: 'no-change-description', due_on: '2019-03-29T07:00:00Z', state: 'open' },
        { title: 'new-description', description: 'modified-description' },
        { title: 'new-state', state: 'closed' },
        { title: 'added' }
      ])

      await plugin.sync()

      expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/milestones/{milestone_number}', {
        owner: 'bkeepers',
        repo: 'test',
        milestone_number: 1
      })

      expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/milestones', {
        owner: 'bkeepers',
        repo: 'test',
        title: 'added'
      })

      expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}/milestones/{milestone_number}', {
        owner: 'bkeepers',
        repo: 'test',
        title: 'new-description',
        description: 'modified-description',
        milestone_number: 2
      })

      expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}/milestones/{milestone_number}', {
        owner: 'bkeepers',
        repo: 'test',
        title: 'new-state',
        state: 'closed',
        milestone_number: 4
      })
    })
  })
})
