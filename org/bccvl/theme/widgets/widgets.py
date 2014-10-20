

JS_WRAPPER = u"""//<![CDATA[
    require(['jquery', 'js/bccvl-widgets'], function($, bccvl) {
        $(document).ready( function() {
            %(js)s
        });
    });//]]>"""

JS_WRAPPER_ADAPTER = lambda req, widget: JS_WRAPPER
