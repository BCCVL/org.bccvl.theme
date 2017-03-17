//
// main JS for the new biodiverse experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate', 'jquery-tablesorter', 'jquery-arrayutils',
     'bbq', 'faceted_view', 'bccvl-widgets', 'livechat', 'bccvl-raven'],
    function($, wiztabs, formvalidator, tablesorter, arrayutils,
             bbq, faceted, bccvl) {

	$(function() {

	    console.log('biodiverse experiment page behaviour loaded.');

            // hook up the wizard buttons
            wiztabs.init();

            // setup dataset select widgets
            var projection = new bccvl.SelectDict("projection");
            // Biodiverse uses selectize
            var setThresholds = function(value, item){
                var selectIdx;
                $.each($('.master-select')[0].selectize.currentResults.items, function(i, obj){
                    if (obj.id === value){
                        selectIdx = i;
                    }
                })
                $.each(projection.$widget.find('select'), function(index, elem){
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
