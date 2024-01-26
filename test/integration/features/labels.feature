Feature: Labels

  Scenario: Create Label
    Given no labels exist
    And a label is added
    When a settings sync is triggered
    Then the label is available

  @wip
  Scenario: Create Label with leading `#`
    When a settings sync is triggered

  @wip
  Scenario: Update Label
    When a settings sync is triggered

  @wip
  Scenario: Remove Label
    When a settings sync is triggered
