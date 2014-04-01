//
// main JS for the new biodiverse experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-form-validator', 'jquery-tablesorter'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          ,  fadeaway           , formvalidator) {

		$(function() {

			console.log('page behaviour loaded.');

			// hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();

            // init the fadeaway instructions
            fadeaway.init();

            // hook up the wizard buttons
            wiztabs.init();
		});
    }
);