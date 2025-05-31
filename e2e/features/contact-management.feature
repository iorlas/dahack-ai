Feature: Contact Management
  As a registered user
  I want to manage my contacts
  So that I can communicate with people I know

  Background:
    Given the chat application is running
    And user "alice" with password "SecurePass123!" exists
    And user "bob" with password "SecurePass123!" exists
    And user "charlie" with password "SecurePass123!" exists
    And I am logged in as "alice"

  Scenario: Successfully add a contact by username
    Given I am on the main chat interface
    When I click on "Add Contact"
    And I enter username "bob"
    And I click "Send Contact Request"
    Then I should see a message "Contact request sent to bob"
    And user "bob" should receive a contact request from "alice"

  Scenario: Add contact with non-existent username
    Given I am on the main chat interface
    When I click on "Add Contact"
    And I enter username "nonexistent_user"
    And I click "Send Contact Request"
    Then I should see an error message "User not found"

  Scenario: Add contact that is already in my contact list
    Given "bob" is already in my contact list
    When I click on "Add Contact"
    And I enter username "bob"
    And I click "Send Contact Request"
    Then I should see an error message "User is already in your contacts"

  Scenario: Accept a contact request
    Given user "bob" has sent me a contact request
    And I am on the main chat interface
    When I go to "Pending Requests"
    And I see a request from "bob"
    And I click "Accept" for "bob"
    Then "bob" should appear in my contact list
    And I should appear in "bob"'s contact list
    And the contact request should be removed from pending

  Scenario: Decline a contact request
    Given user "charlie" has sent me a contact request
    And I am on the main chat interface
    When I go to "Pending Requests"
    And I see a request from "charlie"
    And I click "Decline" for "charlie"
    Then "charlie" should not appear in my contact list
    And I should not appear in "charlie"'s contact list
    And the contact request should be removed from pending

  Scenario: Remove a contact from my contact list
    Given "bob" is in my contact list
    And I am in "bob"'s contact list
    When I go to my contact list
    And I click on "bob"'s contact
    And I click "Remove Contact"
    And I confirm the removal
    Then "bob" should be removed from my contact list
    And I should be removed from "bob"'s contact list

  Scenario: View contact list
    Given "bob" is in my contact list
    And "charlie" is in my contact list
    When I am on the main chat interface
    Then I should see "bob" in my contact list
    And I should see "charlie" in my contact list
    And the contacts should be sorted alphabetically

  Scenario: Search contacts
    Given "bob" is in my contact list
    And "charlie" is in my contact list
    And "diana" is in my contact list
    When I enter "bo" in the contact search field
    Then I should see "bob" in the filtered results
    And I should not see "charlie" in the filtered results
    And I should not see "diana" in the filtered results

  Scenario: Cannot add myself as contact
    When I click on "Add Contact"
    And I enter username "alice"
    And I click "Send Contact Request"
    Then I should see an error message "You cannot add yourself as a contact"
