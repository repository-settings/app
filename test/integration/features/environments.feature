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
