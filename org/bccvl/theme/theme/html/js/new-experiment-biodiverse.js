//
// main JS for the new biodiverse experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate', 'jquery.tablesorter', 'bccvl-widgets'],
    function($, wiztabs, formvalidator, tablesorter, bccvl) {

	$(function() {

	    console.log('biodiverse experiment page behaviour loaded.');

            // hook up the wizard buttons
            wiztabs.init();

            // setup dataset select widgets
            var projection = new bccvl.SelectDict("projection");
            // Biodiverse uses selectize
            var setThresholds = function(value, item){
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
            $.each(projection.$widget.find('select'), function(index, elem) {
                $(elem).selectize({create: true,
                                   persist: false});
            });
            // re init selectize boxes on widget reload
            projection.$widget.on('widgetChanged', function(event) {
                $.each(projection.$widget.find('select'), function(index, elem) {

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
            });

            // TODO: move  select-all / select-none into widget?
            $('#tab-source-projection').on('click', '#form-widgets-projection a.select-all', function(){
                $(this).parents('.selecteditem').find('.selecteddatasets input[type="checkbox"]').prop('checked', 'checked');
            });

            $('#tab-source-projection').on('click', '#form-widgets-projection a.select-none', function(){
                // for some reason we have to remove the property as well to get the html to update in chrome, though the UI works fine
                $(this).parents('.selecteditem').find('.selecteddatasets input[type="checkbox"]').each(function(){
                    $(this).prop('checked', false);
                });
            });


        });
    }
);
