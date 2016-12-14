//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bbq', 'faceted_view.js', 'bccvl-widgets', 'livechat', 'bccvl-raven'],
    function($, wiztabs, formvalidator,
             bbq, faceted, bccvl) {
        // ==============================================================
        // do the work
        $(function() {

            // hook up the wizard buttons
            wiztabs.init();

            // setup dataset select widgets
            new bccvl.SelectDict("species_distribution_models");
            new bccvl.SelectList("future_climate_datasets");

        });


    }
);
