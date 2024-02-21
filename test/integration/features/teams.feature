Feature: Teams

  Scenario: Grant Team Access
    Given no team has been granted access to the repository
    And a team is granted "push" privileges in the config
    When a settings sync is triggered
    Then the team has "push" access granted to it

  Scenario: Update Team Access
    Given a team has been granted "push" privileges to the repository
    And the team privileges are updated to "admin" in the config
    When a settings sync is triggered
    Then the team has "admin" access granted to it

  Scenario: Remove Team Access
    Given a team has been granted "push" privileges to the repository
    And the team privileges are removed in the config
    When a settings sync is triggered
    Then the team has privileges to the repo revoked
