//
// main JS for the new projection experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-widgets', 'new-experiment-common'],
    function($, wiztabs, formvalidator,
             bccvl, expcommon) {
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
            var setThresholds = function(value){
                /**
                 * Refers to the expected value to set for all <select> elements
                 * within this experiment block
                 * 
                 * @type {string}
                 */
                var targetValue = value;

                // "Use Recommended" is to be mapped to the default (Max TPR+TNR)
                if (targetValue === "Use Recommended") {
                    targetValue = "Maximize TPR+TNR";
                }

                // Go through all remaining <select> elements that are NOT the
                // master <select> and set the target value
                $.each(sdmmodel.$widget.find('select'), function(index, elem){
                    if (! $(elem).hasClass('master-select')){
                        $(elem)[0].selectize.setValue(targetValue, true);
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
                        
                        selectize.addOption([
                            { value: "Maximize TPR+TNR", text: "Maximize TPR+TNR" },
                            { value: "Maximize PPV+NPV", text: "Maximize PPV+NPV" },
                            { value: "Balance all errors", text: "Balance all errors" },
                            { value: "TPR = TNR", text: "TPR = TNR" },
                            { value: "0.5", text: "0.5" }
                        ]);
                        
                        selectize.refreshOptions(false);

                    }
                });

                // Initialise entire widget (equivalent to one experiment) to
                // recommended options
                setThresholds("Use Recommended");
            });

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-projection_region')

            // bind widgets to the constraint map
            $('.bccvl-new-projection').on('widgetChanged', function(e){

                // Look for selected SDM experiment
                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('.selectedexperiment').find('input[type="hidden"]'));
                // update any environmental selections
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'));
                // always default to convex hull after a selection.
                $("#use_convex_hull").prop('checked', true);
            })
            
            // TODO: move  select-all / select-none into widget?
            $('#tab-sdm').on('click', '#form-widgets-species_distribution_models a.select-all', function(){
                $(this).parents('.selecteditem').find('input[type="checkbox"]').prop('checked', 'checked');
            });

            $('#tab-sdm').on('click', '#form-widgets-species_distribution_models a.select-none', function(){
                // for some reason we have to remove the property as well to get the html to update in chrome, though the UI works fine
                $(this).parents('.selecteditem').find('input[type="checkbox"]').each(function(){
                    $(this).prop('checked', false);
                });
            });
            
            $('.bccvl-new-projection').trigger('widgetChanged');

            $('.bccvl-new-projection').trigger('widgetChanged');
            
            if(typeof uuid !== "undefined"){
                 $('.bccvl-new-projection, .bccvl-jqueryvalidate').trigger('widgetChanged');
                 $('.bccvl-jqueryvalidate').valid();
                 
                 // -- hook up algo config -------------------------------
                expcommon.init_algorithm_selector('input[name="form.widgets.functions:list"]', true)
                // -- region selection ---------------------------------
                expcommon.init_region_selector()
                // -- psuedo absence controls ---------------------------------
                expcommon.init_pa_controls()
            }
        });

    }
);
