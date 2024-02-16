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

  @wip
  Scenario: Define an Environment with Reviewers

  @wip
  Scenario: Update the reviewer type for an environment

  @wip
  Scenario: Update the id of a reviewer for an environment

  @wip
  Scenario: Add a reviewer to an environment

  @wip
  Scenario: Remove a reviewer from an environment

  @wip
  Scenario: Define an Environment with a Deployment Branch Policy

  @wip
  Scenario: Define a Deployment Branch Policy for an exiting environment

  @wip
  Scenario: Update the Deployment Branch Policy for an environment

  @wip
  Scenario: Reviewers are unchanged, but are sorted differently than the api

  @wip
  Scenario: Unchanged wait-timer considered equivalent to default
