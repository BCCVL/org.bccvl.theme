// The build will inline common dependencies into this file.

// Third party dependencies, like jQuery, should go in the lib folder.

// Configure loading modules from the lib directory,
// except for 'js' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'lib', // load modules from the lib folder
    paths: {
        'js':       '../js',  // bccvl stuff, starting with js/, is in the ../js folder
        'jquery':   'lib/jquery/jquery-2.0.3.js'
    }
});
