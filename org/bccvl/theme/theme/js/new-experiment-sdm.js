
//
// main JS for the new sdm experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation', 'js/bccvl-search', 'bootstrap'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          ,  fadeaway          ,  dimensions,                    search) {
    // ==============================================================
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

            // hook up the search fields
            search.init();

        });
    // ==============================================================
    }
);
