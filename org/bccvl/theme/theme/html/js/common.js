// The build will inline common dependencies into this file.

// Third party dependencies, like jQuery, should go in the lib folder.

// Configure loading modules from the lib directory,
// except for 'js' ones, which are in a sibling
// directory.

requirejs.config({
    baseUrl: (local ? '' : portal_url + '/++resource++bccvl'),          // load modules from the lib folder
    paths: {
        'jquery':               'lib/jquery/jquery-1.11.1.min',                              // Ima say 'jquery', u say jquery-x.y.z.js, dawg
        'jquery-ui':            'lib/jquery-ui/jquery-ui.min',
        'jquery-xmlrpc':        'lib/jquery-xmlrpc/jquery.xmlrpc.min',
        'bootstrap2':            'lib/bootstrap/js/bootstrap.min',
        'bootstrap2-fileupload': 'lib/bootstrap-fileupload/bootstrap-fileupload.min',
        'jquery-validate':      'lib/jquery-validate/jquery.validate.min',
        'jquery-tablesorter':   'lib/jquery-tablesorter/jquery.tablesorter',
        'jquery-form':          'lib/jquery-form/jquery.form.min',
        'jquery-arrayutils':    'lib/jquery-arrayutils/jquery.arrayutils.min',
        'jquery-timer':         'lib/jquery-timer/jquery.timer',
        'selectize':            'lib/selectize/selectize.min',
        'openlayers3':          'lib/ol3/ol',
        'ol3-layerswitcher':    'lib/ol3/layerswitcher/ol3-layerswitcher',
        'prism':                'lib/prism/prism',
        'bbq':                  'lib/jquery-bbq/jquery.ba-bbq',
        'proj4':                'lib/proj4/proj4',
        'raven':                'lib/raven/raven.min',
        'livechat':             'lib/freshdesk/live-chat',
        'aekos-api':            'js/aekos-api',
        'bccvl-api':            'js/bccvl-api',
        'd3':                   'lib/d3/d3.min.js_4.2.2',
        'zip':                  'lib/zip/zip.min',
        'html2canvas':          'lib/html2canvas/html2canvas.min',
        'turf':                 'lib/turfjs/turf.min',
        // our own js files
        'bccvl-api':                  'js/bccvl-api',
        'bccvl-form-jquery-validate': 'js/bccvl-form-jquery-validate',
        'bccvl-form-popover':         'js/bccvl-form-popover',
        'bccvl-modals':               'js/bccvl-modals',
        'bccvl-search':               'js/bccvl-search',
        'bccvl-visualiser-common':    'js/bccvl-visualiser-common',
        'bccvl-visualiser-biodiverse':'js/bccvl-visualiser-biodiverse',
        'bccvl-visualiser-compare-graphs': 'js/bccvl-visualiser-compare-graphs',
        'bccvl-visualiser-compare':   'js/bccvl-visualiser-compare',
        'bccvl-visualiser-map':       'js/bccvl-visualiser-map',
        'bccvl-visualiser-overlay':   'js/bccvl-visualiser-overlay',
        'bccvl-visualiser-progress-bar': 'js/bccvl-visualiser-progress-bar',
        'bccvl-widgets':              'js/bccvl-widgets',
        'bccvl-wizard-tabs':          'js/bccvl-wizard-tabs',
        'dashboard':                  'js/dashboard',
        'dataset-collections':        'js/dataset-collections',
        'dataset-import':             'js/dataset-import',
        'dataset-list':               'js/dataset-list',
        'dataset-upload':             'js/dataset-upload',
        'experiment-list':            'js/experiment-list',
        'experiment-results':         'js/experiment-results',
        'feedback':                   'js/feedback',
        'homepage':                   'js/homepage',
        'login':                      'js/login',
        'new-experiment-common':      'js/new-experiment-common',
        'new-experiment-biodiverse':  'js/new-experiment-biodiverse',
        'new-experiment-ensemble':    'js/new-experiment-ensemble',
        'new-experiment-projection':  'js/new-experiment-projection',
        'new-experiment-sdm':         'js/new-experiment-sdm',
        'new-experiment-msdm':        'js/new-experiment-msdm',
        'new-experiment-mme':         'js/new-experiment-mme',
        'new-experiment-speciestrait':'js/new-experiment-speciestrait',
        'password-reset':             'js/password-reset',
        'search':                     'js/search',
        'training':                   'js/training',
        'youtube':                    'js/youtube',
        'selectize-remove-single':    'js/selectize-remove-single',
        // dynamic js files
        'bccvl-raven':                portal_url + '/bccvl-raven',
        'faceted_view':               portal_url + '/faceted_view'
    },
    shim: {
        'bootstrap2':            ['jquery'],
        'bootstrap2-fileupload': ['jquery', 'bootstrap2'],
        'jquery-xmlrpc':         ['jquery'],
        'jquery-tablesorter':    ['jquery'],
        'jquery-arrayutils':     ['jquery'],
        'jquery-timer':          ['jquery'],
        'bbq':                   ['jquery'],
        'faceted_view':          ['jquery'],
        'raven':                 ['jquery'],
        'zip': { exports:'zip'},
    }
});

// not part of require, just annoying enough to solve everywhere
if (!window.console) {
    window.console = {
        log: (function() {}),
        warn: (function() {})
    };
}
