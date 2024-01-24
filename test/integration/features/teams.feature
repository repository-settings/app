Feature: Teams

  Scenario: Grant Team Access
    Given no team has been granted access to the repository
    And a team is granted "push" privileges in the config
    When a settings sync is triggered
    Then the team has "push" access granted to it
