from plone.testing import z2
from plone.app.robotframework.testing import (
    AUTOLOGIN_LIBRARY_FIXTURE,
)
from org.bccvl.site.testing import (
    BCCVL_FIXTURE
)

from plone.app.themingplugins.testing import ThemingPlugins
from plone.app.testing import IntegrationTesting
from plone.app.testing import FunctionalTesting


# use Theming base layer to ensure theming plugins are setup correctly
class BCCVLThemeLayer(ThemingPlugins):

    defaultBases = (BCCVL_FIXTURE, )

    def setUpZope(self, app, configurationContext):
        super(BCCVLThemeLayer, self).setUpZope(app, configurationContext)
        import org.bccvl.theme
        self.loadZCML('configure.zcml', package=org.bccvl.theme)


    def setUpPloneSite(self, portal):
        # let base layer setup products as needed
        super(BCCVLThemeLayer, self).setUpPloneSite(portal)
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
