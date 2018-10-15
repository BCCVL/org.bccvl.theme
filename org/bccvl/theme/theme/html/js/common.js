// The build will inline common dependencies into this file.

// Third party dependencies, like jQuery, should go in the lib folder.

// Configure loading modules from the lib directory,
// except for 'js' ones, which are in a sibling
// directory.

requirejs.config({
    baseUrl: (local ? '' : portal_url + '/++theme++org.bccvl.theme/html'),          // load modules from the lib folder
    paths: {
        'jquery-ui':                    'lib/jquery-ui/jquery-ui.min',
        'jquery-xmlrpc':                'lib/jquery-xmlrpc/jquery.xmlrpc.min',
        'jquery-validation':            'lib/jquery-validate/jquery.validate.min',
        'jquery.tablesorter':           'lib/jquery-tablesorter/jquery.tablesorter',
        'jquery-form':                  'lib/jquery-form/jquery.form.min',
        'jquery-arrayutils':            'lib/jquery-arrayutils/jquery.arrayutils.min',
        'jquery-timer':                 'lib/jquery-timer/jquery.timer',
        'selectize':                    'lib/selectize/selectize.min',
        'openlayers':                   'lib/ol3/ol',
        'ol3-layerswitcher':            'lib/ol3/layerswitcher/ol3-layerswitcher',
        'prismjs':                      'lib/prism/prism',
        'proj4':                        'lib/proj4/proj4',
        'd3':                           'lib/d3/d3.min.js_4.2.2',
        'zip':                          'lib/zip/zip.min',
        'html2canvas':                  'lib/html2canvas/html2canvas.min',
        'turf':                         'lib/turfjs/turf.min',
        'shpjs':                        'lib/shpjs/shp',

        // our own js lib files
        'aekos-api':                       'js/lib/aekos-api',
        'bccvl-api':                       'js/lib/bccvl-api',
        'bccvl-form-jquery-validate':      'js/lib/bccvl-form-jquery-validate',
        'bccvl-form-popover':              'js/lib/bccvl-form-popover',
        'bccvl-modals':                    'js/lib/bccvl-modals',
        'bccvl-search':                    'js/lib/bccvl-search',
        'bccvl-visualiser-biodiverse':     'js/lib/bccvl-visualiser-biodiverse',
        'bccvl-visualiser-common':         'js/lib/bccvl-visualiser-common',
        'bccvl-visualiser-map':            'js/lib/bccvl-visualiser-map',
        'bccvl-visualiser-progress-bar':   'js/lib/bccvl-visualiser-progress-bar',
        'bccvl-widgets':                   'js/lib/bccvl-widgets',
        'bccvl-wizard-tabs':               'js/lib/bccvl-wizard-tabs',
        'new-experiment-common':           'js/lib/new-experiment-common',
        'selectize-remove-single':         'js/lib/selectize-remove-single',

        'bccvl-visualiser-compare-graphs': 'js/bccvl-visualiser-compare-graphs',
        'bccvl-visualiser-compare':   'js/bccvl-visualiser-compare',
        'bccvl-visualiser-data-exploration': 'js/bccvl-visualiser-data-exploration',
        'bccvl-visualiser-overlay':   'js/bccvl-visualiser-overlay',
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
        'new-experiment-biodiverse':  'js/new-experiment-biodiverse',
        'new-experiment-ensemble':    'js/new-experiment-ensemble',
        'new-experiment-projection':  'js/new-experiment-projection',
        'new-experiment-sdm':         'js/new-experiment-sdm',
        'new-experiment-msdm':        'js/new-experiment-msdm',
        'new-experiment-mme':         'js/new-experiment-mme',
        'new-experiment-speciestrait':'js/new-experiment-speciestrait',
        'new-experiment-speciestrait-temporal': 'js/new-experiment-speciestrait-temporal',
        'password-reset':             'js/password-reset',
        'search':                     'js/search',
        'training':                   'js/training',
        'youtube':                    'js/youtube',
    },
    shim: {
        'jquery':                               {'exports': 'jQuery'},
        'jquery-xmlrpc':                        ['jquery'],
        'jquery.tablesorter':                   ['jquery'],
        'jquery-arrayutils':                    ['jquery'],
        'jquery-timer':                         ['jquery'],
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
