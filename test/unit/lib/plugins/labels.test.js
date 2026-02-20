import { jest } from '@jest/globals'
import { when } from 'jest-when'

import Labels from '../../../../lib/plugins/labels'

describe('Labels', () => {
  let github
  const repoOwner = 'bkeepers'
  const repoName = 'test'

  function configure (config) {
    return new Labels(github, { owner: repoOwner, repo: repoName }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn().mockImplementation(() => Promise.resolve()),
      paginate: jest.fn().mockImplementation(() => Promise.resolve())
    }
  })

  describe('sync', () => {
    it('syncs labels', async () => {
      when(github.paginate)
        .calledWith('GET /repos/{owner}/{repo}/labels', {
          per_page: 100,
          owner: repoOwner,
          repo: repoName,
          headers: { accept: 'application/vnd.github.symmetra-preview+json' }
        })
        .mockResolvedValue([
          { name: 'no-change', color: 'FF0000', description: '' },
          { name: 'new-color', color: 0, description: '' }, // YAML treats `color: 000000` as an integer
          { name: 'new-description', color: '000000', description: '' },
          { name: 'update-me', color: '0000FF', description: '' },
          { name: 'delete-me', color: '000000', description: '' }
        ])

      const plugin = configure([
        { name: 'no-change', color: 'FF0000', description: '' },
        { new_name: 'new-name', name: 'update-me', color: 'FFFFFF', description: '' },
        { name: 'new-color', color: '999999', description: '' },
        { name: 'new-description', color: '#000000', description: 'Hello world' },
        { name: 'added' }
      ])

      await plugin.sync()

      expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/labels/{name}', {
        owner: 'bkeepers',
        repo: 'test',
        name: 'delete-me',
        headers: { accept: 'application/vnd.github.symmetra-preview+json' }
      })

      expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/labels', {
        owner: 'bkeepers',
        repo: 'test',
        name: 'added',
        headers: { accept: 'application/vnd.github.symmetra-preview+json' }
      })

      expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: 'bkeepers',
        repo: 'test',
        name: 'update-me',
        new_name: 'new-name',
        color: 'FFFFFF',
        description: '',
        headers: { accept: 'application/vnd.github.symmetra-preview+json' }
      })

      expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: 'bkeepers',
        repo: 'test',
        name: 'new-color',
        color: '999999',
        description: '',
        headers: { accept: 'application/vnd.github.symmetra-preview+json' }
      })

      expect(github.request).toHaveBeenCalledWith('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: 'bkeepers',
        repo: 'test',
        name: 'new-description',
        color: '000000',
        description: 'Hello world',
        headers: { accept: 'application/vnd.github.symmetra-preview+json' }
      })
    })
  })
})
