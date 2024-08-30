Feature: Repository Rulesets

  @wip
  Scenario: Add a ruleset
    Given no rulesets are defined for the repository
    And a ruleset is defined in the config
    When a settings sync is triggered
    Then the ruleset is enabled for the repository
