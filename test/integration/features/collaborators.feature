Feature: Collaborators

  Scenario: Grant Collaborator Access
    Given no collaborator has been granted access to the repository
    And a collaborator is granted "push" privileges in the config
    When a settings sync is triggered
    Then the collaborator has "push" access granted to it

  Scenario: Update Collaborator Access
    Given a collaborator has been granted "push" privileges to the repository
    And the collaborator privileges are updated to "admin" in the config
    When a settings sync is triggered
    Then the collaborator has "admin" access granted to it

  Scenario: Remove Collaborator Access
    Given a collaborator has been granted "push" privileges to the repository
    And the collaborator privileges are removed in the config
    When a settings sync is triggered
    Then the collaborator has privileges to the repo revoked
