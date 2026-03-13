Feature: Classic Branch Protection

  Scenario: Add a branch-protection rule
    Given no branch-protection rules are defined for the repository
    And a branch-protection rule is defined in the config
    When a settings sync is triggered
    Then the branch-protection rule is enabled for the repository

  Scenario: Update a branch-protection rule
    Given a branch-protection rule exists for the repository
    And the branch-protection rule is modified in the config
    When a settings sync is triggered
    Then the branch-protection rule is updated

  Scenario: Delete a branch-protection rule
    Given a branch-protection rule exists for the repository
    And the branch-protection rule is removed from the config
    When a settings sync is triggered
    Then the branch-protection rule is deleted

  Scenario: No Updates
    Given a branch-protection rule exists for the repository
    And no branch-protection updates are made to the config
    When a settings sync is triggered
#    Then no branch-protection updates are triggered
    Then the branch-protection rule is updated to match the existing value

  Scenario: Remove all branch-protection rules
    Given multiple branch-protection rules exist for the repository
    And all branch-protection rules are removed from the config
    When a settings sync is triggered
    Then all branch-protection rules are deleted
