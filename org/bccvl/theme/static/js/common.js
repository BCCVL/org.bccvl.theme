// The build will inline common dependencies into this file.

// Third party dependencies, like jQuery, should go in the lib folder.

// Configure loading modules from the lib directory,
// except for 'js' ones, which are in a sibling
// directory.

var local = (window.location.port == '9292');

requirejs.config({
    baseUrl: (local ? 'lib' : portal_url + '/++resource++bccvl/lib'),          // load modules from the lib folder
    paths: {
        'js':                   (local ? '../js' : '++resource++bccvl/js'),  // bccvl stuff, which starts with js/, is in the js folder
        'jquery':               'jquery/jquery-2.0.3',                              // Ima say 'jquery', u say jquery-x.y.z.js, dawg
        'jquery-xmlrpc':        'jquery-xmlrpc/jquery.xmlrpc.min',
        'bootstrap':            'bootstrap/js/bootstrap.min',
        'bootstrap-fileupload': 'bootstrap-fileupload/bootstrap-fileupload.min',
        'parsley':              'parsley/parsley.min',
//        'parsley':              'parsley/parsley',
        'jquery-tablesorter':   'jquery-tablesorter/jquery.tablesorter'
    },
    shim: {
        'parsley':              ['jquery'],
        'bootstrap':            ['jquery'],
        'bootstrap-fileupload': ['jquery', 'bootstrap'],
        'jquery-xmlrpc':        ['jquery'],
        'jquery-tablesorter':   ['jquery']
    }
});

// not part of require, just annoying enough to solve everywhere
if (!window.console) {
    window.console = {
        log: (function() {}),
        warn: (function() {})
    };
}
