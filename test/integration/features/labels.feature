Feature: Labels

  Scenario: Create Label
    Given no labels exist
    And a label is added
    When a settings sync is triggered
    Then the label is available

  Scenario: Create Label with leading `#` on the color code
    Given no labels exist
    And a label is added with a leading `#` on the color code
    When a settings sync is triggered
    Then the label is available

  Scenario: Update Label Color
    Given a label exists
    And the color is updated on the existing label
    When a settings sync is triggered
    Then the label has the updated color

  @wip
  Scenario: Update Label Color with color led by `#`

  @wip
  Scenario: Rename a Label
    Given a label exists
    And the name is updated on the existing label
    When a settings sync is triggered
    Then the label has the updated color

  @wip
  Scenario: Label with color matching config if `#` were stripped
    Then no call to update the color is performed

  @wip
  Scenario: Config suggests a name update that has already happened
    Then no call to update the name is performed

  Scenario: Remove Label
    Given a label exists
    And the label is removed from the config
    When a settings sync is triggered
    Then the label is no longer available

  @wip
  Scenario: Label with a short color code

  @wip
  Scenario: Label with numerical color code
