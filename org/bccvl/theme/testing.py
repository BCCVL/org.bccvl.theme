from plone.testing import z2
from plone.app.robotframework.testing import (
    SIMPLE_PUBLICATION_FIXTURE,
    LIVESEARCH_FIXTURE,
    AUTOLOGIN_LIBRARY_FIXTURE,
    REMOTE_LIBRARY_BUNDLE_FIXTURE
    )
from org.bccvl.site.testing import BCCVL_FIXTURE
from plone.app.testing import PloneSandboxLayer
from plone.app.testing import IntegrationTesting
from plone.app.testing import FunctionalTesting


class BCCVLThemeLayer(PloneSandboxLayer):

    defaultBases = (BCCVL_FIXTURE, )

    def setUpPloneSite(self, portal):
        # setup theme for test layer
        self.applyProfile(portal, 'org.bccvl.theme:default')

BCCVL_THEME_FIXTURE = BCCVLThemeLayer()

BCCVL_THEME_INTEGRATION_TESTING = IntegrationTesting(
    bases=(BCCVL_THEME_FIXTURE, ),
    name="BCCVLThemeFixture:Integration")


# TODO: async functional testing not yet ready to use:
TEST_ASYNC = False
if not TEST_ASYNC:

    BCCVL_THEME_FUNCTIONAL_TESTING = FunctionalTesting(
        bases=(BCCVL_THEME_FIXTURE,
               AUTOLOGIN_LIBRARY_FIXTURE,
               z2.ZSERVER_FIXTURE),
        name="BCCVLThemeFixture:Functional")

else:

    from plone.app.async.testing import AsyncLayer
    from plone.app.async.testing import AsyncFunctionalTesting
    from plone.app.async.testing import registerAsyncLayers

    class BCCVLThemeAsyncLayer(AsyncLayer):

        defaultBases = (BCCVL_THEME_FIXTURE, )

        def setUpPloneSite(self, portal):
            # do nothing here, all the setup already done in
            # base layers
            pass

    BCCVL_THEME_ASYNC_FIXTURE = BCCVLThemeAsyncLayer()

    BCCVL_THEME_FUNCTIONAL_TESTING = AsyncFunctionalTesting(
        bases=(BCCVL_THEME_ASYNC_FIXTURE,
               AUTOLOGIN_LIBRARY_FIXTURE,
               z2.ZSERVER_FIXTURE),
        name="BCCVLThemeFixture:Robot")

    registerAsyncLayers([BCCVL_THEME_ASYNC_FIXTURE,
                        BCCVL_THEME_FUNCTIONAL_TESTING])
