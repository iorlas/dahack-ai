Feature: Group Chat
  As a registered user
  I want to create and participate in group chats
  So that I can communicate with multiple people at once

  Background:
    Given the chat application is running
    And user "alice" with password "SecurePass123!" exists
    And user "bob" with password "SecurePass123!" exists
    And user "charlie" with password "SecurePass123!" exists
    And user "diana" with password "SecurePass123!" exists
    And all users are contacts with each other
    And I am logged in as "alice"

  Scenario: Create a new group chat
    Given I am on the main chat interface
    When I click on "Create Group Chat"
    And I enter group name "Project Team"
    And I select participants "bob" and "charlie"
    And I click "Create Group"
    Then a new group chat "Project Team" should be created
    And I should be the owner of the group
    And "bob" and "charlie" should be added as participants
    And all participants should see the new group in their chat list

  Scenario: Send message in group chat
    Given I am a participant in group "Project Team" with "bob" and "charlie"
    When I open the "Project Team" group chat
    And I type "Hello everyone!" in the message input
    And I press Enter
    Then the message "Hello everyone!" should appear in the group chat
    And all participants should receive the message
    And the message should show "alice" as the sender

  Scenario: Receive message in group chat
    Given I am a participant in group "Project Team" with "bob" and "charlie"
    And I have the group chat open
    When "bob" sends the message "Hi team!" to the group
    Then I should see "Hi team!" appear in the group chat
    And the message should show "bob" as the sender
    And "charlie" should also receive the message

  Scenario: Add participant to existing group (as owner)
    Given I own a group chat "Project Team" with participants "bob" and "charlie"
    When I open the group settings
    And I click "Add Participant"
    And I select "diana" from my contacts
    And I click "Add"
    Then "diana" should be added to the group
    And all existing participants should see "diana joined the group"
    And "diana" should see the group in her chat list

  Scenario: Remove participant from group (as owner)
    Given I own a group chat "Project Team" with participants "bob", "charlie", and "diana"
    When I open the group settings
    And I click on "charlie" in the participant list
    And I click "Remove from group"
    And I confirm the removal
    Then "charlie" should be removed from the group
    And other participants should see "charlie was removed from the group"
    And "charlie" should not see the group in her chat list anymore

  Scenario: Leave group chat (as participant)
    Given I am a participant in group "Project Team" owned by "bob"
    When I open the group settings
    And I click "Leave Group"
    And I confirm leaving
    Then I should be removed from the group
    And other participants should see "alice left the group"
    And the group should not appear in my chat list

  Scenario: Leave group chat (as owner with other participants)
    Given I own a group chat "Project Team" with participants "bob" and "charlie"
    When I open the group settings
    And I click "Leave Group"
    Then I should see a message "You must transfer ownership or delete the group first"
    And I should remain in the group

  Scenario: Delete group chat (as owner)
    Given I own a group chat "Project Team" with participants "bob" and "charlie"
    When I open the group settings
    And I click "Delete Group"
    And I confirm deletion
    Then the group should be deleted
    And all participants should see "Group has been deleted"
    And the group should disappear from everyone's chat list

  Scenario: Transfer group ownership
    Given I own a group chat "Project Team" with participants "bob" and "charlie"
    When I open the group settings
    And I click "Transfer Ownership"
    And I select "bob" as the new owner
    And I confirm the transfer
    Then "bob" should become the group owner
    And I should become a regular participant
    And all participants should see "alice transferred ownership to bob"

  Scenario: Group chat with maximum participants
    Given I want to test the 300 participant limit
    When I create a group chat "Large Group"
    And I add 299 participants to the group
    Then the group should have 300 total participants (including me)
    And when I try to add one more participant
    Then I should see an error "Group has reached maximum capacity of 300 participants"

  Scenario: Search messages in group chat
    Given I am in group "Project Team" with message history
    And one message contains "deadline Friday"
    When I open the search function in the group chat
    And I search for "Friday"
    Then I should see the message containing "deadline Friday" highlighted
    And the search should work across all group messages

  Scenario: Group chat history persistence
    Given I am in group "Project Team" with message history
    When I logout and login again
    And I open the "Project Team" group chat
    Then I should see all previous group messages
    And messages should be in chronological order
    And each message should show the correct sender

  Scenario: Edit group name (as owner)
    Given I own a group chat "Project Team"
    When I open the group settings
    And I click "Edit Group Name"
    And I change the name to "Development Team"
    And I save the changes
    Then the group name should update to "Development Team"
    And all participants should see the name change
    And participants should see "alice changed group name to Development Team"

  Scenario: Non-owner cannot edit group settings
    Given "bob" owns a group chat "Project Team" and I am a participant
    When I open the group settings
    Then I should not see options to "Edit Group Name"
    And I should not see options to "Add Participant"
    And I should not see options to "Remove Participant"
    And I should only see "Leave Group" option

  Scenario: Group message with formatting
    Given I am in group "Project Team"
    When I type "This is **important** information" in the group chat
    And I press Enter
    Then the message should appear with "important" formatted in bold
    And all group participants should receive the message with formatting
