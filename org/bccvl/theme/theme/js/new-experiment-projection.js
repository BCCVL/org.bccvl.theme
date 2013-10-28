//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'js/bccvl-wizard-tabs'],
    function($, wiztabs) {
    // ==============================================================

        // call require() to pull in all the dependencies
        var $ = require('jquery');

        // do the work
        $(function() {

            // hook up the wizard buttons
            wiztabs.init();

        });
    // ==============================================================
    }
);
