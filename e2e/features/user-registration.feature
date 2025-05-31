Feature: User Registration and Authentication
  As a new user
  I want to register and login to the chat application
  So that I can communicate with other users

  Background:
    Given the chat application is running
    And the database is clean

  Scenario: Successful user registration
    Given I am on the registration page
    When I enter username "john_doe"
    And I enter password "SecurePass123!"
    And I confirm password "SecurePass123!"
    And I click the register button
    Then I should see a success message
    And I should be redirected to the login page
    And the user "john_doe" should be stored in the database

  Scenario: Registration with mismatched passwords
    Given I am on the registration page
    When I enter username "jane_doe"
    And I enter password "SecurePass123!"
    And I confirm password "DifferentPass456!"
    And I click the register button
    Then I should see an error message "Passwords do not match"
    And I should remain on the registration page

  Scenario: Registration with existing username
    Given a user "existing_user" already exists
    And I am on the registration page
    When I enter username "existing_user"
    And I enter password "SecurePass123!"
    And I confirm password "SecurePass123!"
    And I click the register button
    Then I should see an error message "Username already exists"
    And I should remain on the registration page

  Scenario: Registration with weak password
    Given I am on the registration page
    When I enter username "weak_user"
    And I enter password "123"
    And I confirm password "123"
    And I click the register button
    Then I should see an error message about password requirements
    And I should remain on the registration page

  Scenario: Successful login
    Given a user "john_doe" with password "SecurePass123!" exists
    And I am on the login page
    When I enter username "john_doe"
    And I enter password "SecurePass123!"
    And I click the login button
    Then I should be redirected to the main chat interface
    And I should see my username in the interface

  Scenario: Login with incorrect credentials
    Given a user "john_doe" with password "SecurePass123!" exists
    And I am on the login page
    When I enter username "john_doe"
    And I enter password "WrongPassword"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  Scenario: Login with non-existent user
    Given I am on the login page
    When I enter username "nonexistent_user"
    And I enter password "SomePassword123!"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page
