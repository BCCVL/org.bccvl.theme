from cgi import escape
from collections import OrderedDict

from Acquisition import aq_base
from Products.CMFCore.utils import getToolByName
from Products.CMFPlone.utils import safe_unicode
from plone.app.layout.viewlets import common
from plone.memoize.view import memoize
from zope.component import getMultiAdapter
from zope.i18n import translate


class GlobalSectionsViewlet(common.GlobalSectionsViewlet):
    # uses action.categories to sort portal tabs into hierarchical menu
    #   action categories can have subcategorios
    #   action names are matched via action.id + '_sub'

    def update(self):
        super(GlobalSectionsViewlet, self).update()
        # reorder self.portal_tabs into a hierarchical structure

        tabs = OrderedDict()
        for action in self.portal_tabs:
            categories = action['category'].split('/')
            if len(categories) == 1:
                # a top level item ... just append it, by action id
                tabs[action['id']] = action
            else:
                # TODO: we could use update to allow for submenus being created before main item exists
                # find everything but last item in category path (stripping off _sub)
                categories.pop(0)  # remove first entry as it sholud be the same for everything
                curlevel = tabs
                while categories:
                    # FIXME: assumes _sub is never used inside an action id
                    category = categories.pop(0).rsplit('_sub', 1)[0]
                    menu = curlevel[category]
                    if 'subitems' not in menu:
                        menu['subitems'] = OrderedDict()
                    curlevel = menu['subitems']
                curlevel[action['id']] = action
        self.portal_tabs = tabs


class TitleViewlet(common.TitleViewlet):

    @property
    @memoize
    def page_title(self):
        '''
        Get the page title. If we are in the portal_factory we want use the
        "Add $FTI_TITLE" form (see #12117).

        NOTE: other implementative options can be:
         - to use "Untitled" instead of "Add" or
         - to check the isTemporary method of the edit view instead of the
           creation_flag
        '''
        if (hasattr(aq_base(self.context), 'isTemporary') and
                self.context.isTemporary()):
            # if we are in the portal_factory we want the page title to be
            # "Add fti title"
            portal_types = getToolByName(self.context, 'portal_types')
            fti = portal_types.getTypeInfo(self.context)
            return translate('heading_add_item',
                             domain='plone',
                             mapping={'itemtype': fti.Title()},
                             context=self.request,
                             default='Add ${itemtype}')

        title = getattr(self.view, 'title', None)
        if not title:
            context_state = getMultiAdapter((self.context, self.request),
                                            name=u'plone_context_state')
            title = context_state.object_title()
        return escape(safe_unicode(title))
