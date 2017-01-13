//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bbq', 'faceted_view.js', 'bccvl-widgets', 'new-experiment-common', 'livechat', 'bccvl-raven'],
    function($, wiztabs, formvalidator,
             bbq, faceted, bccvl, expcommon) {
        // ==============================================================
        // do the work
        $(function() {

            // hook up the wizard buttons
            wiztabs.init();

            // setup dataset select widgets
            new bccvl.SelectDict("species_distribution_models");
            new bccvl.SelectList("future_climate_datasets");
            
            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')            
            
            // bind widgets to the constraint map
            $('.bccvl-new-sdm').on('widgetChanged', function(e){
                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'))
            })

        });


    }
);
