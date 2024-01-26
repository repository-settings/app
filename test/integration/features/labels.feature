Feature: Labels

  Scenario: Create Label
    Given no labels exist
    And a label is added
    When a settings sync is triggered
    Then the label is available

  Scenario: Create Label with leading `#`
    Given no labels exist
    And a label is added with a leading `#`
    When a settings sync is triggered
    Then the label is available

  Scenario: Update Label
    Given a label exists
    And the color is updated on the existing label
    When a settings sync is triggered
    Then the label has the updated color

  Scenario: Remove Label
    Given a label exists
    And the label is removed from the config
    When a settings sync is triggered
    Then the label is no longer available

  @wip
  Scenario: Rename a Label

  @wip
  Scenario: Label with color matching config if `#` were stripped
    Then no call to update the color is performed

  @wip
  Scenario:
    Then no call to update the name is performed

  @wip
  Scenario: Label with a short color code

  @wip
  Scenario: Label with numerical color code
