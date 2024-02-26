Feature: Events that do not result in a sync

  Scenario: Push to a non-default branch
    Given changes to the settings file are to be pushed to a non-default branch
    When the settings file changes are pushed
    Then a sync does not get triggered

  Scenario: Repository created when repository does not have a settings file
    Given the repository has no settings file
    When the repository is created
    Then a sync does not get triggered

  Scenario: Repository edited, but default branch was not changed
    Given the default branch is not changed as part of updating the repository
    When the repository is edited
    Then a sync does not get triggered

  Scenario: Repository edited when repository does not have a settings file
    Given the repository has no settings file
    When the repository is edited
    Then a sync does not get triggered
