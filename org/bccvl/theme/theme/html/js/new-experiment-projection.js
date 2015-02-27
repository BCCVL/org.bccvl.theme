//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch',
     'js/bccvl-dimension-equation', 'js/bccvl-form-jquery-validate'],
    function($, viz, wiztabs, stretch, dimensions, formvalidator) {
        // ==============================================================
        // do the work
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();

            // init the dimension chooser thingy
            // dimensions.init();

            // hook up the wizard buttons
            wiztabs.init();

        });


    }
);
