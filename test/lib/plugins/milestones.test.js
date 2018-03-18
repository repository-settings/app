const Milestones = require('../../../lib/plugins/milestones')

describe('Milestones', () => {
  let github

  function configure (config) {
    return new Milestones(github, {owner: 'bkeepers', repo: 'test'}, config)
  }

  beforeEach(() => {
    github = {
      issues: {
        getMilestones: jest.fn().mockImplementation(() => Promise.resolve([])),
        createMilestone: jest.fn().mockImplementation(() => Promise.resolve()),
        deleteMilestone: jest.fn().mockImplementation(() => Promise.resolve()),
        updateMilestone: jest.fn().mockImplementation(() => Promise.resolve())
      }
    }
  })

  describe('sync', () => {
    it('syncs milestones', () => {
      github.issues.getMilestones.mockReturnValueOnce(Promise.resolve({data: [
        {title: 'no-change', description: 'no-change-description', due_on: '2019-03-29T07:00:00Z', state: 'open', number: 5},
        {title: 'new-description', description: 'old-description', due_on: null, state: 'open', number: 2},
        {title: 'new-due', description: 'description', due_on: '2019-06-09T07:00:00Z', state: 'open', number: 3},
        {title: 'new-state', description: 'FF0000', due_on: '2019-09-05T07:00:00Z', state: 'open', number: 4},
        {title: 'remove-milestone', description: 'old-description', due_on: null, state: 'open', number: 1}
      ]}))

      const plugin = configure([
        {title: 'no-change', description: 'no-change-description', due_on: '2019-03-29T07:00:00Z', state: 'open'},
        {title: 'new-description', description: 'modified-description'},
        {title: 'new-due', due_on: '2020-06-19T07:00:00Z'},
        {title: 'new-state', state: 'closed'},
        {title: 'added'}
      ])

      return plugin.sync().then(() => {
        expect(github.issues.deleteMilestone).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          number: 1
        })

        expect(github.issues.createMilestone).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          title: 'added'
        })

        expect(github.issues.updateMilestone).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          title: 'new-description',
          description: 'modified-description',
          number: 2
        })

        expect(github.issues.updateMilestone).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          title: 'new-due',
          due_on: '2020-06-19T07:00:00Z',
          number: 3
        })

        expect(github.issues.updateMilestone).toHaveBeenCalledWith({
          owner: 'bkeepers',
          repo: 'test',
          title: 'new-state',
          state: 'closed',
          number: 4
        })

        expect(github.issues.deleteMilestone).toHaveBeenCalledTimes(1)
        expect(github.issues.updateMilestone).toHaveBeenCalledTimes(3)
        expect(github.issues.createMilestone).toHaveBeenCalledTimes(1)
      })
    })
  })
})
