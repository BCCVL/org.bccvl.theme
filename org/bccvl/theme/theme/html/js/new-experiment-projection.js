//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch',
     'js/bccvl-dimension-equation', 'js/bccvl-form-jquery-validate',
     'bbq', 'faceted_view.js', 'js/bccvl-widgets'],
    function($, viz, wiztabs, stretch, dimensions, formvalidator,
             jqvalidate, bbq, faceted, bccvl) {
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

            // setup dataset select widgets
            new bccvl.SelectDict("species_distribution_models");
            new bccvl.SelectList("future_climate_datasets");

        });


    }
);
