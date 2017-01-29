
//
// main JS for the new sdm experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-form-popover', 'bbq', 'faceted_view.js',
     'bccvl-widgets', 'openlayers3', 'new-experiment-common',
     'livechat', 'bccvl-raven'],
    function($, vizcommon, vizmap, wiztabs, formvalidator,
             popover, bbq, faceted, bccvl, ol, expcommon) {

        // ==============================================================
        $(function() {

            wiztabs.init();         // hook up the wizard buttons

            // setup dataset select widgets
            new bccvl.SelectList("species_occurrence_dataset");
            new bccvl.SelectList("species_absence_dataset");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            expcommon.init_algorithm_selector('input[name="form.widgets.functions:list"]', true)
            // -- region selection ---------------------------------
            expcommon.init_region_selector()

            // -- set up absence radio buttons
            $('#have_absence').click(function(){
                $('.bccvl-noabsence-dataset').slideUp(100);
                $('.bccvl-absencestable').slideDown(100);
                update_pa_strategy('none');
            });
            $('#no_absence').click(function(){
                $('.bccvl-absencestable').slideUp(100);
                $('.bccvl-noabsence-dataset').slideDown(100);
                update_pa_strategy('sre');
            });

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')            
            
            
            // bind widgets to the constraint map
            $('.bccvl-new-sdm').on('widgetChanged', function(e){
                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'))
            })

        });

        // ==============================================================
        function update_pa_strategy(strategyname) {
            var $algoCheckboxes = $('input[name="form.widgets.functions:list"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);
                if ($checkbox.prop('checked')) {
                    // Set new option
                    $('select[name="form.widgets.' + $checkbox.attr('value') + '.pa_strategy:list"]').val(strategyname);
                }
            });            
        }

    }
);
