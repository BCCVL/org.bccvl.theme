//
// main JS for the new biodiverse experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate', 'jquery-tablesorter', 'jquery-arrayutils',
     'bbq', 'faceted_view.js', 'bccvl-widgets', 'livechat'],
    function($, wiztabs, formvalidator, tablesorter, arrayutils,
             bbq, faceted, bccvl) {

	$(function() {

	    console.log('biodiverse experiment page behaviour loaded.');

            // hook up the wizard buttons
            wiztabs.init();

            // setup dataset select widgets
            var projection = new bccvl.SelectDict("projection");
            // Biodiverse uses selectize 
            var setThresholds = function(v, d){
                $.each(projection.$widget.find('select'), function(index, elem){
                    console.log($(elem)[0].selectize);
                    $(elem)[0].selectize.addOption({ text: v, value: v })
                    $(elem)[0].selectize.addItem(v, true);
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
                    
                    var $select = $(elem).selectize({create: true,
                                       persist: false}); 
                    var selectize = $select[0].selectize;    
                    
                    if ($(elem).hasClass('master-select')){
                        selectize.on('item_add', setThresholds);
                        selectize.on('option_add', setThresholds);
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
