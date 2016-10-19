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
        'jquery-csvtotable':    'lib/jquery-csvtotable/jquery.csvToTable',
        'selectize':            'lib/selectize/selectize.min',        
        'openlayers3':          'lib/ol3/ol',
        'ol3-layerswitcher':    'lib/ol3/layerswitcher/ol3-layerswitcher',
        'ol3cesium':           'lib/ol3cesium/ol3cesium-debug',
        'cesium':               'lib/ol3cesium/CesiumUnminified/Cesium',
        'prism':                'lib/prism/prism',
        'bbq':                  'lib/jquery-bbq/jquery.ba-bbq',
        'proj4':                'lib/proj4/proj4',
        'raven':                'https://cdn.ravenjs.com/2.1.1/raven.min',
        'livechat':             'lib/freshdesk/live-chat',
        'aekos-api':            'js/aekos-api',
        'd3':                   'lib/d3/d3.min.js_4.2.2',
        'zip':                  'lib/zip/zip.min',
        // our own js files        
        'bccvl-form-jquery-validate': 'js/bccvl-form-jquery-validate',
        'bccvl-form-popover':         'js/bccvl-form-popover',
        'bccvl-modals':               'js/bccvl-modals',
        'bccvl-preview-layout':       'js/bccvl-preview-layout',
        'bccvl-remove-dataset-modal': 'js/bccvl-remove-dataset-modal',
        'bccvl-remove-experiment-modal': 'js/bccvl-remove-experiment-modal',        
        'bccvl-search':               'js/bccvl-search',
        'bccvl-sharing-modal':        'js/bccvl-sharing-modal',
        'bccvl-stretch':              'js/bccvl-stretch',
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
        'layer-edit-modal':           'js/layer-edit-modal',
        'login':                      'js/login',
        'new-experiment-biodiverse':  'js/new-experiment-biodiverse',
        'new-experiment-ensemble':    'js/new-experiment-ensemble',
        'new-experiment-projection':  'js/new-experiment-projection',
        'new-experiment-sdm':         'js/new-experiment-sdm',
        'new-experiment-msdm':        'js/new-experiment-msdm',
        'new-experiment-speciestrait': 'js/new-experiment-speciestrait',
        'password-reset':             'js/password-reset',
        'search':                     'js/search',
        'training':                     'js/training',
        'youtube':                    'js/youtube',
        'selectize-remove-single':    'js/selectize-remove-single'
    },
    shim: {
        'bootstrap2':            ['jquery'],
        'bootstrap2-fileupload': ['jquery', 'bootstrap2'],
        'jquery-xmlrpc':        ['jquery'],
        'jquery-tablesorter':   ['jquery'],
        'jquery-arrayutils':    ['jquery'],
        'jquery-timer':         ['jquery'],
        'raven':                ['jquery'],
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
