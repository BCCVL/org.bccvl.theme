from plone.testing import z2
from plone.app.robotframework.testing import (
    AUTOLOGIN_LIBRARY_FIXTURE,
)
from org.bccvl.site.testing import (
    BCCVL_FIXTURE, BCCVL_ASYNC_FIXTURE,
    BCCVLAsyncFunctionalTesting
)
from plone.app.testing import PloneSandboxLayer
from plone.app.testing import IntegrationTesting
from plone.app.testing import FunctionalTesting


class BCCVLThemeLayer(PloneSandboxLayer):

    defaultBases = (BCCVL_FIXTURE, )

    def setUpZope(self, app, configurationContext):
        import org.bccvl.theme
        self.loadZCML('configure.zcml', package=org.bccvl.theme)

    def setUpPloneSite(self, portal):
        # setup theme for test layer
        self.applyProfile(portal, 'org.bccvl.theme:default')

BCCVL_THEME_FIXTURE = BCCVLThemeLayer()

BCCVL_THEME_INTEGRATION_TESTING = IntegrationTesting(
    bases=(BCCVL_THEME_FIXTURE, ),
    name="BCCVLThemeFixture:Integration")


BCCVL_THEME_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(BCCVL_THEME_FIXTURE,
           AUTOLOGIN_LIBRARY_FIXTURE,
           z2.ZSERVER_FIXTURE),
    name="BCCVLThemeFixture:Functional")


class BCCVLAsyncThemeLayer(PloneSandboxLayer):

    defaultBases = (BCCVL_ASYNC_FIXTURE, )

    def setUpZope(self, app, configurationContext):
        import org.bccvl.theme
        self.loadZCML('configure.zcml', package=org.bccvl.theme)

    def setUpPloneSite(self, portal):
        # setup theme for test layer
        self.applyProfile(portal, 'org.bccvl.theme:default')

BCCVL_THEME_ASYNC_FIXTURE = BCCVLAsyncThemeLayer()

BCCVL_THEME_ASYNC_FUNCTIONAL_TESTING = BCCVLAsyncFunctionalTesting(
    bases=(BCCVL_THEME_ASYNC_FIXTURE,
           AUTOLOGIN_LIBRARY_FIXTURE,
           z2.ZSERVER_FIXTURE),
    name="BCCVLThemeAsyncFixture:Functional")
