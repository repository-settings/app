Feature: Environments

  Scenario: Define an Environment
    Given no environments are defined
    And an environment is defined in the config
    When a settings sync is triggered
    Then the environment is available

  Scenario: Update an Environment
    Given an environment exists
    And the environment is modified in the config
    When a settings sync is triggered
    Then the environment is updated

  Scenario: Delete an Environment
    Given an environment exists
    And the environment is removed from the config
    When a settings sync is triggered
    Then the environment is no longer available

  Scenario: Define an Environment with Reviewers
    Given no environments are defined
    And an environment is defined in the config with reviewers
    When a settings sync is triggered
    Then the environment is available with reviewers

  Scenario: Update the reviewer type for an environment
    Given an environment exists with reviewers defined
    And a reviewer has its type changed
    When a settings sync is triggered
    Then the reviewer type is updated

  Scenario: Update the id of a reviewer for an environment
    Given an environment exists with reviewers defined
    And a reviewer has its id changed
    When a settings sync is triggered
    Then the reviewer id is updated

  Scenario: Add a reviewer to an environment
    Given an environment exists
    And a reviewer is added to the environment
    When a settings sync is triggered
    Then the reviewer is defined for the environment

  Scenario: Remove a reviewer from an environment
    Given an environment exists with reviewers defined
    And a reviewer is removed from the environment in the config
    When a settings sync is triggered
    Then the reviewer is removed from the environment

  @wip
  Scenario: Define an Environment with a Deployment Branch Policy
    When a settings sync is triggered

  @wip
  Scenario: Define a Deployment Branch Policy for an exiting environment
    When a settings sync is triggered

  @wip
  Scenario: Update the Deployment Branch Policy for an environment
    When a settings sync is triggered

  @wip
  Scenario: Reviewers are unchanged, but are sorted differently than the api
    When a settings sync is triggered

  @wip
  Scenario: Unchanged wait-timer considered equivalent to default
    When a settings sync is triggered
