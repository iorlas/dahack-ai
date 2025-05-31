Feature: Advanced Features
  As a registered user
  I want access to advanced chat features
  So that I can have a richer communication experience

  Background:
    Given the chat application is running
    And user "alice" with password "SecurePass123!" exists
    And user "bob" with password "SecurePass123!" exists
    And user "charlie" with password "SecurePass123!" exists
    And "alice" and "bob" are contacts
    And I am logged in as "alice"

  # Message Reactions/Emotions
  Scenario: Add reaction to message in one-on-one chat
    Given I have a chat open with "bob"
    And "bob" has sent me the message "Great job on the project!"
    When I hover over the message
    And I click the reaction button
    And I select the "👍" emoji
    Then the message should display the "👍" reaction
    And "bob" should see that I reacted with "👍"
    And the reaction count should show "1"

  Scenario: Add reaction to message in group chat
    Given I am in group chat "Project Team" with "bob" and "charlie"
    And "bob" has sent the message "Meeting at 2 PM"
    When I add a "✅" reaction to the message
    Then the message should display the "✅" reaction
    And all group participants should see my reaction
    And the reaction should show "alice" as the reactor

  Scenario: Multiple users react to same message
    Given I am in group chat "Project Team" with "bob" and "charlie"
    And there is a message "Pizza party tomorrow!"
    When I react with "🍕"
    And "bob" reacts with "🍕"
    And "charlie" reacts with "🎉"
    Then the message should show "🍕 2" and "🎉 1"
    And hovering over reactions should show who reacted

  Scenario: Remove reaction from message
    Given I have reacted to a message with "👍"
    When I click on my "👍" reaction
    Then my reaction should be removed
    And the reaction count should decrease
    And other users should see the updated reaction count

  # Contact Information Viewing
  Scenario: View contact info for direct contact
    Given "bob" is in my contact list
    When I click on "bob"'s profile in the chat
    Then I should see "bob"'s contact information
    And I should see his username
    And I should see when he was last online
    And I should see options to "Remove Contact" or "Block User"

  Scenario: View contact info for group chat participant
    Given I am in group "Project Team" with "bob" and "charlie"
    And "charlie" is not in my direct contacts
    When I click on "charlie"'s name in the group chat
    Then I should see "charlie"'s basic information
    And I should see his username
    And I should see an option to "Add to Contacts"
    And I should not see sensitive information

  Scenario: Cannot view info for non-contact outside group
    Given "charlie" is not in my contacts
    And "charlie" is not in any of my group chats
    When I try to search for "charlie"'s profile
    Then I should not be able to access his information
    And I should see "User information not available"

  # Persistent URL Structure
  Scenario: Direct URL to one-on-one chat
    Given I have a chat with "bob"
    When I copy the chat URL
    Then the URL should be in format "/chat/user/bob"
    And when I visit this URL directly
    Then it should open the chat with "bob"
    And I should see our chat history

  Scenario: Direct URL to group chat
    Given I am in group "Project Team" with ID "12345"
    When I copy the group chat URL
    Then the URL should be in format "/chat/group/12345"
    And when I visit this URL directly
    Then it should open the "Project Team" group chat
    And I should see the group chat history

  Scenario: Share chat URL with unauthorized user
    Given I have a private chat URL with "bob"
    When an unauthorized user tries to access the URL
    Then they should be redirected to login
    And after login, they should see "Access denied" if not authorized

  Scenario: Bookmark and revisit chat URLs
    Given I bookmark the URL for my chat with "bob"
    When I close the browser and reopen it later
    And I visit the bookmarked URL
    Then I should be taken directly to the chat with "bob"
    And all functionality should work normally

  # Performance Testing Tool
  Scenario: Access performance testing dashboard
    Given I am an administrator user
    When I navigate to "/admin/performance"
    Then I should see the performance testing dashboard
    And I should see options for "Load Testing" and "Message Throughput Testing"

  Scenario: Run concurrent user load test
    Given I am on the performance testing dashboard
    When I configure a test for "500 concurrent users"
    And I set the test duration to "5 minutes"
    And I click "Start Load Test"
    Then the test should begin
    And I should see real-time metrics including:
      | Metric | Expected |
      | Active Connections | Up to 500 |
      | Messages Per Second | Up to 50 |
      | Response Time | < 100ms |
      | Error Rate | < 1% |

  Scenario: Run message throughput test
    Given I am on the performance testing dashboard
    When I configure a "Message Throughput Test"
    And I set it to send "50 messages per second"
    And I set the duration to "2 minutes"
    And I click "Start Test"
    Then the system should handle the message load
    And I should see metrics showing successful message delivery
    And the system should maintain stability

  Scenario: Performance test results export
    Given I have completed performance tests
    When I click "Export Results"
    Then I should be able to download a CSV file
    And the file should contain detailed metrics
    And the file should include timestamps and performance data

  # WebSocket and Polling Fallback
  Scenario: Automatic WebSocket connection
    Given I am logged into the application
    When I open a chat
    Then the system should establish a WebSocket connection
    And I should see a "Connected" indicator
    And real-time messaging should work instantly

  Scenario: Fallback to polling when WebSocket fails
    Given I am in a chat with WebSocket connected
    When the WebSocket connection is blocked or fails
    Then the system should automatically fall back to HTTP polling
    And I should see a "Reconnecting" indicator briefly
    And messaging should continue to work with polling

  Scenario: Automatic reconnection to WebSocket
    Given I am using HTTP polling fallback
    When the WebSocket becomes available again
    Then the system should automatically reconnect to WebSocket
    And real-time performance should be restored
    And I should see the "Connected" indicator

  # Global Message Search
  Scenario: Search across all chats
    Given I have messages in multiple chats
    And one message with "budget report" exists in chat with "bob"
    And one message with "budget meeting" exists in group "Project Team"
    When I use the global search function
    And I search for "budget"
    Then I should see results from both chats
    And results should show which chat each message is from
    And I should be able to click to go directly to that chat

  Scenario: Search with filters
    Given I have extensive chat history
    When I search for "deadline"
    And I filter by "Last 7 days"
    And I filter by "Group chats only"
    Then I should see only matching messages from group chats in the last week
    And the results should be sorted by relevance and date
