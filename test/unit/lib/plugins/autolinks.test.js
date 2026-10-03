import { jest } from '@jest/globals'
import { when } from 'jest-when'

import Autolinks from '../../../../lib/plugins/autolinks'

describe('Autolinks', () => {
  let github
  const repoOwner = 'bkeepers'
  const repoName = 'test'

  function configure (config) {
    return new Autolinks(github, { owner: repoOwner, repo: repoName }, config)
  }

  beforeEach(() => {
    github = {
      request: jest.fn().mockImplementation(() => Promise.resolve()),
      paginate: jest.fn().mockImplementation(() => Promise.resolve())
    }
  })

  describe('sync', () => {
    it('syncs autolinks', async () => {
      when(github.paginate)
        .calledWith('GET /repos/{owner}/{repo}/autolinks', {
          per_page: 100,
          owner: repoOwner,
          repo: repoName
        })
        .mockResolvedValue([
          {
            id: 1,
            key_prefix: 'NO-CHANGE-',
            url_template: 'https://jira.example.com/browse/NO-CHANGE-<num>',
            is_alphanumeric: true
          },
          {
            id: 2,
            key_prefix: 'NEW-TEMPLATE-',
            url_template: 'https://old.example.com/browse/NEW-TEMPLATE-<num>',
            is_alphanumeric: true
          },
          {
            id: 3,
            key_prefix: 'NEW-ALPHANUMERIC-',
            url_template: 'https://jira.example.com/browse/NEW-ALPHANUMERIC-<num>',
            is_alphanumeric: true
          },
          {
            id: 4,
            key_prefix: 'DELETE-ME-',
            url_template: 'https://jira.example.com/browse/DELETE-ME-<num>',
            is_alphanumeric: true
          }
        ])

      const plugin = configure([
        {
          key_prefix: 'NO-CHANGE-',
          url_template: 'https://jira.example.com/browse/NO-CHANGE-<num>'
        },
        {
          key_prefix: 'NEW-TEMPLATE-',
          url_template: 'https://jira.example.com/browse/NEW-TEMPLATE-<num>'
        },
        {
          key_prefix: 'NEW-ALPHANUMERIC-',
          url_template: 'https://jira.example.com/browse/NEW-ALPHANUMERIC-<num>',
          is_alphanumeric: false
        },
        {
          key_prefix: 'ADDED-',
          url_template: 'https://jira.example.com/browse/ADDED-<num>',
          is_alphanumeric: false
        }
      ])

      await plugin.sync()

      expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/autolinks', {
        owner: repoOwner,
        repo: repoName,
        key_prefix: 'ADDED-',
        url_template: 'https://jira.example.com/browse/ADDED-<num>',
        is_alphanumeric: false
      })

      expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}', {
        owner: repoOwner,
        repo: repoName,
        autolink_id: 4
      })

      // the API has no update endpoint, so changed autolinks are removed and recreated
      expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}', {
        owner: repoOwner,
        repo: repoName,
        autolink_id: 2
      })
      expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/autolinks', {
        owner: repoOwner,
        repo: repoName,
        key_prefix: 'NEW-TEMPLATE-',
        url_template: 'https://jira.example.com/browse/NEW-TEMPLATE-<num>'
      })

      expect(github.request).toHaveBeenCalledWith('DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}', {
        owner: repoOwner,
        repo: repoName,
        autolink_id: 3
      })
      expect(github.request).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/autolinks', {
        owner: repoOwner,
        repo: repoName,
        key_prefix: 'NEW-ALPHANUMERIC-',
        url_template: 'https://jira.example.com/browse/NEW-ALPHANUMERIC-<num>',
        is_alphanumeric: false
      })

      // `NO-CHANGE-` is left alone
      expect(github.request).toHaveBeenCalledTimes(6)
    })

    it('removes before recreating a changed autolink', async () => {
      const calls = []
      github.request = jest.fn().mockImplementation(endpoint => {
        calls.push(endpoint)
        return Promise.resolve()
      })
      when(github.paginate)
        .calledWith('GET /repos/{owner}/{repo}/autolinks', { per_page: 100, owner: repoOwner, repo: repoName })
        .mockResolvedValue([{ id: 1, key_prefix: 'JIRA-', url_template: 'https://old.example.com/browse/JIRA-<num>' }])

      const plugin = configure([{ key_prefix: 'JIRA-', url_template: 'https://new.example.com/browse/JIRA-<num>' }])

      await plugin.sync()

      expect(calls).toEqual([
        'DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}',
        'POST /repos/{owner}/{repo}/autolinks'
      ])
    })

    it('does nothing when the configured autolinks already exist', async () => {
      when(github.paginate)
        .calledWith('GET /repos/{owner}/{repo}/autolinks', { per_page: 100, owner: repoOwner, repo: repoName })
        .mockResolvedValue([
          {
            id: 1,
            key_prefix: 'JIRA-',
            url_template: 'https://jira.example.com/browse/JIRA-<num>',
            is_alphanumeric: false
          }
        ])

      const plugin = configure([
        {
          key_prefix: 'JIRA-',
          url_template: 'https://jira.example.com/browse/JIRA-<num>',
          is_alphanumeric: false
        }
      ])

      await plugin.sync()

      expect(github.request).not.toHaveBeenCalled()
    })

    it('treats an omitted `is_alphanumeric` as the API default', async () => {
      when(github.paginate)
        .calledWith('GET /repos/{owner}/{repo}/autolinks', { per_page: 100, owner: repoOwner, repo: repoName })
        .mockResolvedValue([
          {
            id: 1,
            key_prefix: 'JIRA-',
            url_template: 'https://jira.example.com/browse/JIRA-<num>',
            is_alphanumeric: true
          }
        ])

      const plugin = configure([{ key_prefix: 'JIRA-', url_template: 'https://jira.example.com/browse/JIRA-<num>' }])

      await plugin.sync()

      expect(github.request).not.toHaveBeenCalled()
    })

    it('does nothing when no autolinks are configured', async () => {
      const plugin = configure(undefined)

      await plugin.sync()

      expect(github.paginate).not.toHaveBeenCalled()
      expect(github.request).not.toHaveBeenCalled()
    })
  })
})
