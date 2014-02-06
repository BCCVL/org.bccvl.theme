*** Settings ***

Resource  plone/app/robotframework/selenium.robot

Library  Remote  ${PLONE_URL}/RobotRemote


Test Setup  Open test browser
Test Teardown  Close all browsers

*** Test Cases ***

Site Administrator can access control panel
    Given I'm logged in as a 'Site Administrator'
    Then I see the BCCVL Home

*** Keywords ***

I'm logged in as a '${ROLE}'
    Enable autologin as  ${ROLE}
    Go to  ${PLONE_URL}

I see the BCCVL Home
    Title should be  BCCVL Home
