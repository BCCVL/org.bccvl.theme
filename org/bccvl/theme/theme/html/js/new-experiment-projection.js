//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bbq', 'faceted_view', 'bccvl-widgets', 'new-experiment-common', 'livechat', 'bccvl-raven'],
    function($, wiztabs, formvalidator,
             bbq, faceted, bccvl, expcommon) {
        // ==============================================================
        // do the work
        $(function() {

            // hook up the wizard buttons
            wiztabs.init();

            // -- region selection ---------------------------------
            expcommon.init_region_selector()
            // -- psuedo absence controls ---------------------------------
            expcommon.init_pa_controls()

            // setup dataset select widgets
            new bccvl.SelectDict("species_distribution_models");
            new bccvl.SelectList("future_climate_datasets");

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-projection_region')

            // bind widgets to the constraint map
            $('.bccvl-new-projection').on('widgetChanged', function(e){
                // Look for selected SDM experiment
                expcommon.update_constraints_map(constraints, $('body').find('.selectedexperiment').find('input[type="hidden"]'))
            })

        });


    }
);
