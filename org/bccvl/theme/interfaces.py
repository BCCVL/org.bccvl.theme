from plone.theme.interfaces import IDefaultPloneLayer
from plonetheme.sunburst.browser.interfaces import IThemeSpecific
from plone.app.z3cform.interfaces import IPloneFormLayer

#class IBCCVLThemeLayer(IDefaultPloneLayer):
class IBCCVLThemeLayer(IThemeSpecific, IPloneFormLayer):
    # derive from all layers where we want to override things
    """
    Marker interface applied to the request if this theme is active.
    """
