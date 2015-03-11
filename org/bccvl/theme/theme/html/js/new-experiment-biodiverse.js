//
// main JS for the new biodiverse experiment page.
//
define(
    ['jquery', 'js/bccvl-wizard-tabs',
     'js/bccvl-form-jquery-validate', 'jquery-tablesorter', 'jquery-arrayutils'],
    function($, wiztabs, formvalidator) {

	$(function() {

	    console.log('biodiverse experiment page behaviour loaded.');

            // hook up the wizard buttons
            wiztabs.init();

        });
    }
);
