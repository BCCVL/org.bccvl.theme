//
// main JS for the new projection experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation', 'js/bccvl-form-validator'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          , fadeaway           ,  dimensions                  ,  formvalidator) {
    // ==============================================================

        // do the work
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();

            // init the fadeaway instructions
            fadeaway.init();

            // init the dimension chooser thingy
            dimensions.init();

            // hook up the wizard buttons
            wiztabs.init();

        });
    // ==============================================================
    }
);
