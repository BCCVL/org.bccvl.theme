import unittest2 as unittest

import robotsuite
from org.bccvl.theme.testing import BCCVL_THEME_FUNCTIONAL_TESTING
from org.bccvl.theme.testing import BCCVL_THEME_ASYNC_FUNCTIONAL_TESTING
from plone.testing import layered


def test_suite():
    suite = unittest.TestSuite()
    suite.addTests([
        layered(robotsuite.RobotTestSuite('test_first.robot'),
                layer=BCCVL_THEME_ASYNC_FUNCTIONAL_TESTING),
    ])
    return suite
