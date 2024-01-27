Feature: Milestones

  Scenario: Add Milestone
    Given no milestones exist
    And a milestone is added
    When a settings sync is triggered
    Then the milestone is available
