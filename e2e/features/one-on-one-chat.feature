Feature: One-on-One Chat
  As a registered user
  I want to chat with my contacts
  So that I can communicate privately with individuals

  Background:
    Given the chat application is running
    And user "alice" with password "SecurePass123!" exists
    And user "bob" with password "SecurePass123!" exists
    And "alice" and "bob" are contacts
    And I am logged in as "alice"

  Scenario: Send a text message
    Given I am on the main chat interface
    When I click on "bob" in my contact list
    And I type "Hello Bob!" in the message input
    And I press Enter
    Then the message "Hello Bob!" should appear in the chat
    And the message should be marked as sent
    And "bob" should receive the message "Hello Bob!" from "alice"

  Scenario: Receive a text message in real-time
    Given I have a chat open with "bob"
    When "bob" sends me the message "Hi Alice!"
    Then I should see "Hi Alice!" appear in the chat immediately
    And the message should show "bob" as the sender
    And the message should have a timestamp

  Scenario: Send message with bold formatting
    Given I have a chat open with "bob"
    When I type "This is **bold text**" in the message input
    And I press Enter
    Then the message should appear with "bold text" formatted in bold
    And "bob" should receive the message with bold formatting

  Scenario: Send message with italic formatting
    Given I have a chat open with "bob"
    When I type "This is *italic text*" in the message input
    And I press Enter
    Then the message should appear with "italic text" formatted in italics
    And "bob" should receive the message with italic formatting

  Scenario: Send message with mixed formatting
    Given I have a chat open with "bob"
    When I type "This has **bold** and *italic* text" in the message input
    And I press Enter
    Then the message should appear with correct formatting for both bold and italic
    And "bob" should receive the message with mixed formatting

  Scenario: View chat history
    Given I have exchanged messages with "bob" previously
    When I click on "bob" in my contact list
    Then I should see all previous messages in chronological order
    And each message should show the correct sender
    And each message should show the correct timestamp

  Scenario: Chat history persistence
    Given I have a chat with "bob" containing messages
    When I logout and login again
    And I click on "bob" in my contact list
    Then I should still see all previous messages
    And the messages should be in the same order

  Scenario: Search messages in chat
    Given I have a chat with "bob" containing multiple messages
    And one message contains "important deadline"
    When I open the search function in the chat
    And I search for "deadline"
    Then I should see the message containing "important deadline" highlighted
    And other messages should be filtered out or dimmed

  Scenario: Message delivery confirmation
    Given I have a chat open with "bob"
    When I send a message "Test message"
    And the message reaches the server
    Then I should see a delivery confirmation
    And the message status should change from "sending" to "delivered"

  Scenario: Handle message sending when offline
    Given I have a chat open with "bob"
    And I lose internet connection
    When I type "Offline message" and press Enter
    Then the message should show as "pending"
    And when I reconnect to the internet
    Then the message should be sent automatically
    And the status should update to "delivered"

  Scenario: Empty message handling
    Given I have a chat open with "bob"
    When I press Enter without typing anything
    Then no message should be sent
    And the message input should remain empty

  Scenario: Very long message handling
    Given I have a chat open with "bob"
    When I type a message longer than 1000 characters
    And I press Enter
    Then the message should be sent successfully
    And it should display properly in the chat interface
    And "bob" should receive the complete message

  Scenario: Special characters in messages
    Given I have a chat open with "bob"
    When I type "Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?" and press Enter
    Then the message should appear with all special characters intact
    And "bob" should receive the message with all special characters
