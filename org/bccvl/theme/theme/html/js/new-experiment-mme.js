
//
// main JS for the new migratory experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-form-popover',
     'bccvl-widgets', 'openlayers', 'new-experiment-common'],
    function($, vizcommon, vizmap, wiztabs, formvalidator,
             popover, bccvl, ol, expcommon) {

        // ==============================================================
        $(function() {
            wiztabs.init();         // hook up the wizard buttons

            // setup dataset select widgets
            new bccvl.SelectList("species_occurrence_dataset");
            new bccvl.SelectList("species_absence_dataset");
            //new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            expcommon.init_algorithm_selector('input[name="form.widgets.function:list"]', false)
            // -- region selection ---------------------------------
            expcommon.init_region_selector()
            // -- psuedo absence controls ---------------------------------
            expcommon.init_pa_controls()

            // -- set up absence radio buttons
            $('#have_absence').click(function(){
                $('.bccvl-noabsence-dataset').slideUp(100);
                $('.bccvl-absencestable').slideDown(100);
                update_pa_strategy('none');
            });
            $('#no_absence').click(function(){
                $('.bccvl-absencestable').slideUp(100);
                $('.bccvl-noabsence-dataset').slideDown(100);
                update_pa_strategy('random');
            });

            // Check if there is a pseudo absence dataset.
            if ($('input[name="form.widgets.species_absence_dataset:list"]').length > 0) {
                $('#have_absence').prop('checked', true);
                $('.bccvl-noabsence-dataset').slideUp(100);
                $('.bccvl-absencestable').slideDown(100);
            } else {
                $('#no_absence').prop('checked', true);
                $('.bccvl-absencestable').slideUp(100);
                $('.bccvl-noabsence-dataset').slideDown(100);
            }
            
            // Change default PA settings for algorithm based on user PA selection
            $('.bccvl-new-sdm').on('change', '#have_absence', function(){
                if($(this).prop('checked')){
                    $('.paramgroup').find('select').each(function(){
                      var sel = $(this);
                      if(sel.attr('id').indexOf('pa-strategy') > -1){
                          sel.val('none');
                      }
                    })
                }
            });
                    
            $('.bccvl-new-sdm').on('change', '#no_absence', function(){
                if($(this).prop('checked')){
                    $('.paramgroup').find('select').each(function(){
                      var sel = $(this);
                      if(sel.attr('id').indexOf('pa-strategy') > -1){
                          sel.val('random');
                      }
                    })
                }
            });

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')
            
            // Draw constraint on map if any
            expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'));
            
            // bind widgets to the constraint map
            $('.bccvl-new-mme').on('widgetChanged', function(e){

                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'));
                // always default to convex hull after a selection.
                $("#use_convex_hull").prop('checked', true);
            })


            function DataSubsets(fieldname) {

                this.fieldname = fieldname

                // used to generate unique subset id's
                var subsetCount = 0
                // hold all information
                var subsets = []
                // top level widget element
                var $widget = $('#formfield-form-widgets-' + fieldname)
                // container to put subset markup in
                var $container = $('#form-widgets-' + fieldname)
                // textarea so submit
                var $textarea = $('#form-widgets-' + fieldname + '-textarea')

                // render modal for subset
                function getModal(modalid) {
                    return  '<div id="' + modalid + '" class="modal large hide fade new-experiment" tabindex="-1" role="dialog">' +
                                '<div class="modal-header">' +
                                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>' +
                                    '<h3 id="myModalLabel">Select Environmental Data for This Subset</h3>' +
                                '</div>' +
                                '<div id="modal-body" class="modal-body"></div>' +
                                '<div class="modal-footer">' +
                                    '<button class="btn btn-primary">Select Layers</button>' +
                                '</div>' +
                            '</div>'
                }

                // render subset widget - produces markup for SelectData as well
                function getSubset(fieldname, subsetNum) {
                    var widgetid = 'form-widgets-' + fieldname + '-' + subsetNum
                    var datasetwidgetid = widgetid + '-items'
                    var datasetmodalid = fieldname + '-' + subsetNum + '-items-modal'
                    return  '<div id="' + widgetid + '" class="row-fluid mme-subset">' +
                                '<fieldset class="subset">' +
                                    '<div class="span8">' +
                                        getModal(datasetmodalid) +
                                        '<p><strong>Environmental Variables</strong></p>' +
                                        '<div class="control-group bccvl-environmentaldatatable">' +
                                            '<div id="' + datasetwidgetid + '" data-multiple="multiple">' +
                                                '<span class="loader-container">' +
                                                    '<img src="/bccvl/++resource++bccvl/images/bccvl-loader.gif" alt="BCCVL" class="loader" style="display: inline-block;">' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>' +
                                        '<a href="'+location.origin+'/portal_facetconfig/environmental_datasets" id="' + fieldname + '-' + subsetNum + '-items-popup" class="btn btn-primary enviro-selection-button">Select Datasets</a>' +
                                    '</div>' +
                                    '<div class="span4">' +
                                        '<a data-subsetnum="' + subsetNum + '" class="btn btn-danger btn-small pull-right remove-subset"><i class="fa fa-times"></i> Remove Subset</a> ' +
                                        '<p><strong>Month Subset</strong></p>' +
                                        '<label for="' + widgetid + '-title">Title</label>' +
                                        '<input id="' + widgetid + '-title" name="subset.title" type="text" placeholder="Title for occurrence subset" class="required" required />' +
                                        '<label for="' + widgetid + '-value">Months (in desired order, separated by commas)</label>' +
                                        '<input id="' + widgetid + '-value" name="subset.value" type="text" placeholder="e.g. 1,2,3 or 11,12,1" class="required comma-alpha-numeric" required />' +
                                    '</div>' +
                                '</fieldset>' +
                            '</div>'
                }

                function updateValue() {
                    data = []
                    for (subset of subsets) {
                        var subsetdata = {
                            environmental_datasets: subset.datawidget.val(),
                            subset: {
                                value: subset.widget.find('input[name="subset.value"]').val().split(','),
                                title: subset.widget.find('input[name="subset.title"]').val()
                            }
                        }
                        data.push(subsetdata)
                    }
                    $textarea.val(JSON.stringify(data, null, 4))
                }

                $widget.on('click', '#' + fieldname + '-popup', function(e) {
                    e.preventDefault()

                    var subsetNum = subsetCount++;
                    // add subset markup
                    $container.append(getSubset(fieldname, subsetNum))
                    // reference to widget
                    var $subsetWidget = $('#form-widgets-' + fieldname + '-' + subsetNum)
                    // subsets data selector
                    var dataWidget = new bccvl.SelectData(fieldname + '-' + subsetNum + '-items')
                    // open modal
                    dataWidget.$modaltrigger.click()
                    // keep reference to sub widget
                    subsets.push({
                        subsetNum: subsetNum,
                        widget: $subsetWidget,
                        datawidget: dataWidget
                    })
                    // listen for change events on new subset widget
                    $subsetWidget.on('change', function(e) {
                        // some field or selection has changed...
                        updateValue();
                    })

                })

                // remov one subset section
                $widget.on('click', '.remove-subset', function(e) {
                    // redraw entire list of subsets based on information from
                    // subsets variable (and/or textarea content)
                    if( $('#tab-enviro fieldset').find('.mme-subset').length <= 1 ) {
                        alert('You must have at least one subset defined for this experiment type.');
                        return
                    }
                    //cleanup subsets variable
                    var subsetNum = parseInt($(e.target).data('subsetnum'))
                    for(var i = subsets.length -1; i >= 0 ; i--) {
                        var subset = subsets[i]
                        if(subset.subsetNum == subsetNum) {
                            subsets.splice(i, 1)[0];
                            // remove modal
                            subset.datawidget.modal.$modal.remove()
                            subset.widget.remove()
                        }
                    }
                    updateValue();
                })

            }

            var subsets = new DataSubsets('datasubsets')
            
            if(typeof uuid !== "undefined"){
                 $('.bccvl-new-mme, .bccvl-jqueryvalidate').trigger('widgetChanged');
                 $('.bccvl-jqueryvalidate').valid();
                 
                 // -- hook up algo config -------------------------------
                expcommon.init_algorithm_selector('input[name="form.widgets.functions:list"]', true)
                // -- region selection ---------------------------------
                expcommon.init_region_selector()
                // -- psuedo absence controls ---------------------------------
                expcommon.init_pa_controls()
            }

        });

        // ==============================================================
    }
);
