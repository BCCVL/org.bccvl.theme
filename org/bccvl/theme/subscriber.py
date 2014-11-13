
def pubstart(event):

    if event.request.getHeader('HTTP_X_THEME_DISABLED'):
        event.request.response.setHeader('X-Theme-Disabled', 1)
