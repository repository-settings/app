Feature: Milestones

  Scenario: Add Milestone
    Given no milestones exist
    And a milestone is added
    When a settings sync is triggered
    Then the milestone is available

  Scenario: Update a Milestone
    Given a milestone exists
    And the milestone is updated in the config
    When a settings sync is triggered
    Then updated milestone is available

  Scenario: Delete a milestone
    Given a milestone exists
    And the milestone is removed from the config
    When a settings sync is triggered
    Then the milestone is no longer available
