//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs', 'bccvl-stretch',
     'bccvl-form-jquery-validate',
     'bbq', 'faceted_view.js', 'bccvl-widgets'],
    function($, wiztabs, stretch, formvalidator,
             bbq, faceted, bccvl) {
        // ==============================================================
        // do the work
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            // init the dimension chooser thingy
            // dimensions.init();

            // hook up the wizard buttons
            wiztabs.init();

            // setup dataset select widgets
            new bccvl.SelectDict("species_distribution_models");
            new bccvl.SelectList("future_climate_datasets");

        });


    }
);
