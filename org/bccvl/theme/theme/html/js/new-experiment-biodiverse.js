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
            $.each(projection.$widget.find('select'), function(index, elem) {
                $(elem).selectize({create: true,
                                   persist: false});
            });
            // re init selectize boxes on widget reload
            projection.$widget.on('widgetChanged', function(event) {
                $.each(projection.$widget.find('select'), function(index, elem) {
                    $(elem).selectize({create: true,
                                       persist: false});
                });
            });


        });
    }
);
