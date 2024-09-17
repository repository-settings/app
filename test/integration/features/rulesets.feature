Feature: Repository Rulesets

  Scenario: Add a ruleset
    Given no rulesets are defined for the repository
    And a ruleset is defined in the config
    When a settings sync is triggered
    Then the ruleset is enabled for the repository

  Scenario: Update a ruleset
    Given a ruleset exists for the repository
    And the ruleset is modified in the config
    When a settings sync is triggered
    Then the ruleset is updated

  Scenario: Delete a ruleset
    Given a ruleset exists for the repository
    And the ruleset is removed from the config
    When a settings sync is triggered
    Then the ruleset is deleted
