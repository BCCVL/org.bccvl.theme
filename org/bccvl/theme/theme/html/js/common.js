// The build will inline common dependencies into this file.

// Third party dependencies, like jQuery, should go in the lib folder.

// Configure loading modules from the lib directory,
// except for 'js' ones, which are in a sibling
// directory.

requirejs.config({
    baseUrl: (local ? 'lib' : portal_url + '/++resource++bccvl/lib'),          // load modules from the lib folder
    paths: {
        'js':                   (local ? '../js' : '++resource++bccvl/js'),  // bccvl stuff, which starts with js/, is in the js folder
        'jquery':               'jquery/jquery-1.11.1.min',                              // Ima say 'jquery', u say jquery-x.y.z.js, dawg
        'jquery-ui':            'jquery-ui/jquery-ui.min',
        'jquery-xmlrpc':        'jquery-xmlrpc/jquery.xmlrpc.min',
        'bootstrap':            'bootstrap/js/bootstrap.min',
        'bootstrap-fileupload': 'bootstrap-fileupload/bootstrap-fileupload.min',
        'parsley':              'parsley/parsley.min',
//        'parsley':              'parsley/parsley',
        'jquery-validate':      'jquery-validate/jquery.validate.min',
        'jquery-tablesorter':   'jquery-tablesorter/jquery.tablesorter',
        'jquery-form':          'jquery-form/jquery.form.min',
        'jquery-arrayutils':    'jquery-arrayutils/jquery.arrayutils.min',
        'jquery-timer':         'jquery-timer/jquery.timer',
        'jquery-csvtotable':    'jquery-csvtotable/jquery.csvToTable',
        'select2':              'select2/select2.min',
        'OpenLayers':           'openlayers/OpenLayers',
        'prism':                'prism/prism'
    },
    shim: {
        'parsley':              ['jquery'],
        'bootstrap':            ['jquery'],
        'bootstrap-fileupload': ['jquery', 'bootstrap'],
        'jquery-xmlrpc':        ['jquery'],
        'jquery-tablesorter':   ['jquery'],
        'jquery-arrayutils':    ['jquery'],
        'jquery-timer':         ['jquery'],
        'select2':              ['jquery']
    }
});

// not part of require, just annoying enough to solve everywhere
if (!window.console) {
    window.console = {
        log: (function() {}),
        warn: (function() {})
    };
}
