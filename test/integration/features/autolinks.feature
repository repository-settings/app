Feature: Autolinks

  Scenario: Add Autolink
    Given no autolinks exist
    And an autolink is added
    When a settings sync is triggered
    Then the autolink is available

  Scenario: Update an Autolink
    Given an autolink exists
    And the autolink is updated in the config
    When a settings sync is triggered
    Then the updated autolink is available

  Scenario: Delete an autolink
    Given an autolink exists
    And the autolink is removed from the config
    When a settings sync is triggered
    Then the autolink is no longer available
