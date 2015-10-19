from collections import OrderedDict
from plone.app.layout.viewlets import common


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
