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
            var sdmmodel = new bccvl.SelectDict("species_distribution_models");
            new bccvl.SelectList("future_climate_datasets");

            // Biodiverse uses selectize
            var setThresholds = function(value, item){
                var selectIdx;
                $.each($('.master-select')[0].selectize.currentResults.items, function(i, obj){
                    if (obj.id === value){
                        selectIdx = i;
                    }
                })
                $.each(sdmmodel.$widget.find('select'), function(index, elem){
                    if (! $(elem).hasClass('master-select')){
                        $.each($(elem)[0].selectize.currentResults.items, function(i, obj){
                           if (selectIdx == i){
                               $(elem)[0].selectize.setValue(obj.id, true);
                           }
                        });
                    }
                });
            }
            // is this still in use?
            $.each(sdmmodel.$widget.find('select'), function(index, elem) {
                $(elem).selectize({create: true,
                                   persist: false});
            });
            // re init selectize boxes on widget reload
            sdmmodel.$widget.on('widgetChanged', function(event) {
                $.each(sdmmodel.$widget.find('select'), function(index, elem) {

                    if ($(elem).hasClass('master-select')){
                        var $select = $(elem).selectize({create: false,
                                       persist: false});
                        var selectize = $select[0].selectize;

                        selectize.on('item_add', setThresholds);
                    } else {
                        var $select = $(elem).selectize({create: true,
                                       persist: false});
                        var selectize = $select[0].selectize;

                    }
                });
            });

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-projection_region')

            // bind widgets to the constraint map
            $('.bccvl-new-projection').on('widgetChanged', function(e){
                // Look for selected SDM experiment
                expcommon.update_constraints_map(constraints, $('body').find('.selectedexperiment').find('input[type="hidden"]'))
            })

        });

    }
);