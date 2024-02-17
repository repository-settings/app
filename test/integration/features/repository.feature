Feature: Repository

  Scenario: Basic repository settings
    Given basic repository config is defined
    When a settings sync is triggered
    Then the repository will be configured

  Scenario: Repository with topics defined
    Given topics are defined in the repository config
    When a settings sync is triggered
    Then topics are updated

  @wip
  Scenario: Repository with vulnerability alerts enabled
    When a settings sync is triggered

  @wip
  Scenario: Repository with security fixes enabled
    When a settings sync is triggered
