
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
            //new bccvl.SelectDict("environmental_datasets");

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
            
            
            var subsetsField = $('#form-widgets-environmental_datasets_group');
            var subsetNum = 0;
            
            $('.bccvl-new-mme').on('click', '#add_subset_button', function(e){

               var modal = '<div id="environmental_datasets_'+subsetNum+'-modal" class="modal large hide fade new-experiment" tabindex="-1" role="dialog">'+
                                '<div class="modal-header">'+
                                  '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
                                  '<h3 id="myModalLabel">Select Environmental Data for This Subset</h3>'+
                                '</div>'+
                                '<div id="modal-body" class="modal-body"></div>'+
                                '<div class="modal-footer">'+
                                  '<button class="btn btn-primary">Select Layers</button>'+
                                '</div>'+
                              '</div>';
               //
               //var modalButton = subset.find('.enviro-selection-button');
               //var numWidget = $('.bccvl-new-mme').find('.mme-subset').length;
               //var subsetIndex = 'environmental_datasets_'+numWidget;
            //
               //// problem use case here if user adds then deletes a subset
               //// currently just for dev purposes
               //
               //subset.find('.bccvl-environmentaldatatable').find('div,input,label').each(function(i, el){
//
               //    
               //     if (typeof $(this).attr('name') !== "undefined"){
               //         var name = $(this).attr('name').split('.');
               //         var idx = $.inArray('environmental_datasets', name);
               //         if (idx){
               //             name[idx] = subsetIndex;
               //             $(this).attr('name', name.join('.') );
               //         }
               //     }
               //    
               //     if (typeof $(this).attr('id') !== "undefined") {
               //         var newId = $(this).attr('id').split('-');
               //         var idx = $.inArray('environmental_datasets', newId);
               //         if (idx){
               //             newId[idx] = subsetIndex;
               //             $(this).attr('id', newId.join('-') );
               //         }
               //     }
               //     
               //     if (typeof $(this).attr('for') !== "undefined") {
               //         var newFor = $(this).attr('for').split('-');
               //         var idx = $.inArray('environmental_datasets', newFor);
               //         if (idx){
               //             newFor[idx] = subsetIndex;
               //             $(this).attr('for', newFor.join('-') );
               //         }
               //     }
               //    
               //    if (typeof $(this).attr('data-fieldname') !== "undefined"){
               //        var newFieldname = $(this).attr('data-fieldname').split('.');
               //        var idx = $.inArray('environmental_datasets', newFieldname);
               //        if(idx){
               //             newFieldname[idx] = subsetIndex;
               //             $(this).attr('data-fieldname', newFieldname.join('.') );  
               //        }
               //    }
               //});
               //
               //modalButton.attr('id', subsetIndex+'-popup' );
               //modal.attr('id', subsetIndex+'-modal');
               //
               //$('body').prepend(modal);
               //
               //subset.find('input').val('');
               //subset.find('.bccvl-environmentaldatatable .selecteditem').remove();
               //$(e.target).before(subset);
              
               
               var subsetMarkup = '<div class="row-fluid mme-subset">'+
                        '<fieldset class="subset">'+
                            '<div class="span8">'+
                                '<p><strong>Environmental Variables</strong></p>'+
                                '<div class="control-group bccvl-environmentaldatatable">'+
                                    '<div id="form-widgets-environmental_datasets_'+subsetNum+'" data-multiple="multiple">'+
                                        '<span class="loader-container">'+
                                            '<img src="/bccvl/++resource++bccvl/images/bccvl-loader.gif" alt="BCCVL" class="loader" style="display: inline-block;">'+
                                        '</span>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                            '<div class="span4">'+
                              '<a class="btn btn-danger btn-small pull-right remove-subset"><i class="fa fa-times"></i> Remove Subset</a> '+
                              '<p><strong>Month Subset</strong></p>'+
                              '<label for="subset_title_'+subsetNum+'">Title</label>'+
                              '<input id="subset_title_'+subsetNum+'" name="subset_title_'+subsetNum+'" type="text" placeholder="Title for occurrence subset" class="required" required />'+
                              '<label for="subset_'+subsetNum+'">Months (in desired order, separated by commas)</label>'+
                              '<input id="subset_'+subsetNum+'" name="subset_'+subsetNum+'" type="text" placeholder="e.g. 1,2,3 or 11,12,1" class="required comma-alpha-numeric" required />'+
                            '</div>'+
                            '<a href="'+location.origin+'/portal_facetconfig/environmental_datasets" id="environmental_datasets_'+subsetNum+'-popup" style="display:none;">Hidden trigger</a>'+
                        '</fieldset>'+
                    '</div>';
                    
                $('#subsets').append(subsetMarkup);
                $('body').prepend(modal);
               
                var widget = new bccvl.SelectData('environmental_datasets_'+subsetNum+'');
                
                widget.$modaltrigger.click()
                
                // need to add bboxes for the contraints tab to pick up.
                $('.bccvl-new-mme').trigger('widgetChanged');
                
                // this fires on build, instead of the widgets 'modal_apply' event, or something after
                // must fix
                serialiseSubsets();
                subsetNum += 1;
            });
            
            $('#subsets').on('change', 'input', function(event, input){
                serialiseSubsets();
            });
            
            var serialiseSubsets = function(){
                
                var selection = []
                
                $('#subsets').find('fieldset.subset').each(function(i, fieldset){

                    var subset = [];
                    $(fieldset).find('input').each(function(i,input){
                        // checkbox fields not serializing properly?
                        // this produces an array for the tab, 
                        // populated by arrays for each fieldset
                        // whats desired format?
                        subset.push($(input).serialize());
                    });
                    selection.push(subset);
                });
                
                subsetsField.val(selection);
            };
            
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
