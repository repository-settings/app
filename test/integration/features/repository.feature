Feature: Repository

  @focus
  Scenario: Basic repository settings
    Given basic repository config is defined
    When a settings sync is triggered
    Then the repository will be configured

  @wip
  Scenario: Repository with topics defined
    When a settings sync is triggered

  @wip
  Scenario: Repository with vulnerability alerts enabled
    When a settings sync is triggered

  @wip
  Scenario: Repository with security fixes enabled
    When a settings sync is triggered
