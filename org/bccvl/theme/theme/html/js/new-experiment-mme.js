
//
// main JS for the new migratory experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-form-popover', 'bbq', 'faceted_view.js',
     'bccvl-widgets', 'openlayers3', 'new-experiment-common', 'bccvl-raven'],
    function($, vizcommon, vizmap, wiztabs, formvalidator,
             popover, bbq, faceted, bccvl, ol, expcommon) {

        // ==============================================================
        $(function() {
            wiztabs.init();         // hook up the wizard buttons

            // setup dataset select widgets
            new bccvl.SelectDict("species_occurrence_collections");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            expcommon.init_algorithm_selector('input[name="form.widgets.function:list"]', false)
            // -- region selection ---------------------------------
            expcommon.init_region_selector()

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')
            
            // bind widgets to the constraint map
            $('.bccvl-new-mme').on('widgetChanged', function(e){
                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'))
            })
            
            
            $('.bccvl-new-mme').on('click', '#add_subset_button', function(e){
               var subset = $('#tab-enviro fieldset .mme-subset').last().clone(); 
               var modal = $('#environmental_datasets-modal').first().clone();
               
               var modalButton = subset.find('.enviro-selection-button');
               var numWidget = $('.bccvl-new-mme').find('.mme-subset').length;
               var subsetIndex = 'environmental_datasets_'+numWidget;
            
               // problem use case here if user adds then deletes a subset
               // currently just for dev purposes
               
               subset.find('.bccvl-environmentaldatatable').find('div,input,label').each(function(i, el){

                   
                    if (typeof $(this).attr('name') !== "undefined"){
                        var name = $(this).attr('name').split('.');
                        var idx = $.inArray('environmental_datasets', name);
                        if (idx){
                            name[idx] = subsetIndex;
                            $(this).attr('name', name.join('.') );
                        }
                    }
                   
                    if (typeof $(this).attr('id') !== "undefined") {
                        var newId = $(this).attr('id').split('-');
                        var idx = $.inArray('environmental_datasets', newId);
                        if (idx){
                            newId[idx] = subsetIndex;
                            $(this).attr('id', newId.join('-') );
                        }
                    }
                    
                    if (typeof $(this).attr('for') !== "undefined") {
                        var newFor = $(this).attr('for').split('-');
                        var idx = $.inArray('environmental_datasets', newFor);
                        if (idx){
                            newFor[idx] = subsetIndex;
                            $(this).attr('for', newFor.join('-') );
                        }
                    }
                   
                   if (typeof $(this).attr('data-fieldname') !== "undefined"){
                       var newFieldname = $(this).attr('data-fieldname').split('.');
                       var idx = $.inArray('environmental_datasets', newFieldname);
                       if(idx){
                            newFieldname[idx] = subsetIndex;
                            $(this).attr('data-fieldname', newFieldname.join('.') );  
                       }
                   }
               });
               
               modalButton.attr('id', subsetIndex+'-popup' );
               modal.attr('id', subsetIndex+'-modal');
               
               $('body').prepend(modal);
               
               subset.find('input').val('');
               subset.find('.bccvl-environmentaldatatable .selecteditem').remove();
               $(e.target).before(subset);
               
               new bccvl.SelectDict(subsetIndex);
            });
            
            $('.bccvl-new-mme').on('click', '.remove-subset', function(e){
                if( $('#tab-enviro fieldset').find('.mme-subset').length > 1 ){
                    $(e.target).parents('.mme-subset').remove(); 
                } else {
                    alert('You must have at least one subset defined for this experiment type.');
                }
                
            });
                        
        });

        // ==============================================================
    }
);
