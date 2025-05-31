Feature: Image Sharing
  As a registered user
  I want to share images in chats
  So that I can communicate visually with my contacts and groups

  Background:
    Given the chat application is running
    And user "alice" with password "SecurePass123!" exists
    And user "bob" with password "SecurePass123!" exists
    And user "charlie" with password "SecurePass123!" exists
    And "alice" and "bob" are contacts
    And I am logged in as "alice"

  Scenario: Share image in one-on-one chat
    Given I have a chat open with "bob"
    When I click the "Attach Image" button
    And I select a valid JPEG image file "vacation.jpg"
    And I click "Send"
    Then the image should be uploaded to cloud storage
    And the image should appear in the chat
    And "bob" should receive the image
    And the image should be clickable for full view

  Scenario: Share image in group chat
    Given I am in a group chat "Project Team" with "bob" and "charlie"
    When I click the "Attach Image" button
    And I select a valid PNG image file "diagram.png"
    And I click "Send"
    Then the image should be uploaded to cloud storage
    And the image should appear in the group chat
    And all group participants should receive the image
    And the image should show "alice" as the sender

  Scenario: Share multiple image formats
    Given I have a chat open with "bob"
    When I upload a JPEG image
    Then it should be accepted and displayed
    When I upload a PNG image
    Then it should be accepted and displayed
    When I upload a GIF image
    Then it should be accepted and displayed
    When I upload a WebP image
    Then it should be accepted and displayed

  Scenario: Reject invalid image formats
    Given I have a chat open with "bob"
    When I try to upload a PDF file "document.pdf"
    Then I should see an error "Only image files are allowed"
    And the file should not be uploaded

  Scenario: Reject oversized images
    Given I have a chat open with "bob"
    When I try to upload an image larger than 10MB
    Then I should see an error "Image size cannot exceed 10MB"
    And the file should not be uploaded

  Scenario: Image upload progress indicator
    Given I have a chat open with "bob"
    When I select a large image file for upload
    Then I should see an upload progress indicator
    And I should be able to cancel the upload if needed
    And when upload completes, the progress indicator should disappear

  Scenario: Image thumbnail generation
    Given I have shared an image in chat with "bob"
    When the image appears in the chat
    Then it should display as a thumbnail
    And the thumbnail should maintain aspect ratio
    And clicking the thumbnail should show the full-size image

  Scenario: View full-size image
    Given there is an image in my chat with "bob"
    When I click on the image thumbnail
    Then a full-size image viewer should open
    And I should be able to zoom in and out
    And I should be able to close the viewer
    And I should be able to download the image

  Scenario: Image persistence
    Given I have shared images in chat with "bob"
    When I logout and login again
    And I open the chat with "bob"
    Then all previously shared images should still be visible
    And images should load from cloud storage
    And thumbnails should display correctly

  Scenario: Image search in chat history
    Given I have shared multiple images with "bob"
    And one image was sent with message "team photo"
    When I search for "team photo" in the chat
    Then the message with the image should appear in search results
    And the image thumbnail should be visible in search results

  Scenario: Failed image upload handling
    Given I have a chat open with "bob"
    When I try to upload an image but the upload fails
    Then I should see an error message "Failed to upload image"
    And I should have the option to retry the upload
    And the message should not be sent

  Scenario: Image compression for large files
    Given I have a chat open with "bob"
    When I upload a high-resolution image under 10MB
    Then the system should compress the image if needed
    And the compressed image should maintain reasonable quality
    And the upload should complete successfully

  Scenario: Multiple images in single message
    Given I have a chat open with "bob"
    When I select multiple images at once
    And I click "Send"
    Then all images should be uploaded to cloud storage
    And all images should appear in a single message
    And "bob" should receive all images together

  Scenario: Image caption/message with image
    Given I have a chat open with "bob"
    When I select an image "sunset.jpg"
    And I add a caption "Beautiful sunset today!"
    And I click "Send"
    Then the image should appear with the caption below it
    And "bob" should receive both the image and caption

  Scenario: Cloud storage URL security
    Given I have shared an image in chat with "bob"
    When the image is stored in cloud storage
    Then the image URL should not be publicly accessible
    And only authenticated users with access to the chat should view the image
    And image URLs should have appropriate expiration

  Scenario: Image loading failure handling
    Given there is an image in my chat with "bob"
    When the cloud storage is temporarily unavailable
    Then I should see a placeholder indicating the image failed to load
    And I should have an option to retry loading the image
    And the chat should remain functional

  Scenario: Bandwidth optimization
    Given I have a chat with multiple images
    When I'm on a slow connection
    Then images should load progressively
    And thumbnails should load before full images
    And I should have an option to disable auto-loading of images
