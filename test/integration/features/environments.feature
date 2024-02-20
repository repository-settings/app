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

  Scenario: Define an Environment with a protected branches Deployment Branch Policy
    Given no environments are defined
    And an environment is defined in the config with a protected branches deployment branch policy
    When a settings sync is triggered
    Then the environment is available with a protected branches deployment branch policy

  Scenario: Define an Environment with a custom branches Deployment Branch Policy
    Given no environments are defined
    And an environment is defined in the config with a custom branches deployment branch policy
    When a settings sync is triggered
    Then the environment is available with a custom branches deployment branch policy

  Scenario: Define a protected deployment Branch Policy for an exiting environment
    Given an environment exists
    And a protected deployment branch policy is defined for the environment
    When a settings sync is triggered
    Then the protected branches deployment branch policy is available for the environment

  Scenario: Define a custom branches Deployment Branch Policy for an exiting environment
    Given an environment exists
    And a custom deployment branch policy is defined for the environment
    When a settings sync is triggered
    Then the custom branches deployment branch policy is available for the environment

  Scenario: Update the protected branches Deployment Branch Policy for an environment
    Given an environment exists with a "protected" branches deployment branch policy
    And a custom deployment branch policy is defined for the environment
    When a settings sync is triggered
    Then the custom branches deployment branch policy is available for the environment

  Scenario: Update the custom branches Deployment Branch Policy for an environment
    Given an environment exists with a "custom" branches deployment branch policy
    And a protected deployment branch policy is defined for the environment
    When a settings sync is triggered
    Then custom deployment branch policies are removed
    And the protected branches deployment branch policy is available for the environment

  Scenario: Reviewers are unchanged, but are sorted differently than the api
    Given an environment exists with reviewers defined
    And an environment is defined in the config with the same reviewers but sorted differently
    When a settings sync is triggered
    Then no update will happen

  Scenario: Unchanged wait-timer considered equivalent to default
    Given an environment exists without wait-timer defined
    And wait-timer is not defined for the environment in the config
    When a settings sync is triggered
    Then no update will happen

  Scenario: Unchanged deployment branch policy
    Given an environment exists with a "custom" branches deployment branch policy
    And an environment is defined in the config with the same custom branches deployment branch policy but sorted differently
    When a settings sync is triggered
    Then no update will happen
