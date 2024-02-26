Feature: Repository

  Scenario: Basic repository settings
    Given basic repository config is defined
    When a settings sync is triggered
    Then the repository will be configured

  Scenario: Repository with topics defined
    Given topics are defined in the repository config
    When a settings sync is triggered
    Then topics are updated

  Scenario: Repository with vulnerability alerts enabled
    Given vulnerability alerts are "enabled" in the config
    When a settings sync is triggered
    Then vulnerability alerts are "enabled"

  Scenario: Repository with vulnerability alerts disabled
    Given vulnerability alerts are "disabled" in the config
    When a settings sync is triggered
    Then vulnerability alerts are "disabled"

  Scenario: Repository with security fixes enabled
    Given security fixes are "enabled" in the config
    When a settings sync is triggered
    Then security fixes are "enabled"

  Scenario: Repository with security fixes disabled
    Given security fixes are "disabled" in the config
    When a settings sync is triggered
    Then security fixes are "disabled"
