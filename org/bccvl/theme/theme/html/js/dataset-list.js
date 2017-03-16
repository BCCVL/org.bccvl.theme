//
// main JS for the dataset list page.
//
define(
    ['jquery', 'bccvl-visualiser-map', 'bccvl-visualiser-common',
     'bccvl-modals', 'bccvl-api', 'openlayers3',
     'bootstrap2', 'jquery-tablesorter', 'jquery-form', 'selectize',
     'bbq', 'faceted_view', 'selectize-remove-single', 'bccvl-raven'],

    function($, vizmap, vizcommon, modals, bccvlapi) {

        $(window).load(function(evt) {
            Faceted.Load(evt, window.location.origin+window.location.pathname+'/');
        });
        $(window).unload(function() {
            Faceted.Unload();
        });
        
        // ==============================================================
        $(function() {

            $('.bccvl-datasetstable').tablesorter({
                headers: {
                    2: { sorter: false } // should be link column
                },
                sortList: [[0,1]]
            });

            /* This is a temporary sorting method, will do it within template later
            $('select.groupme').each(function(){
                $(this).find('option').each(function(){
                    var val = $(this).val();
                    var type = val.substr(0, val.indexOf('-'));
                    console.log(type);
                });
            });*/

            $('select.selectize').selectize({
                plugins: ['remove_button', 'remove_single_button'],
                render: {
                    'option': function(data, escape) {
                        var opt_class="option"
                        var opt_style="";
                        if (data.disabled) {
                            opt_class += " faceted-select-item-disabled";
                        }
                        var opt_text = '<div class="' + opt_class + '">' + escape(data[this.settings.labelField]);
                        if (typeof data.count !== 'undefined') {
                            opt_text += ' <span class="badge">' + data.count + '</span>';
                        }
			return opt_text + '</div>';
		    },
                    'item': function(data, escape) {
                        var item_text = '<div class="item">' + escape(data[this.settings.labelField]);
                        if (typeof data.count !== 'undefined') {
                            item_text += ' <span class="badge">' + data.count + '</span>';
                        }
                        return item_text + '</div>';
                    }
                }
            });

            // duplicate top bar filters as hidden fields in the filters form
            // wont set after being created, something wrong with the dom, has to be hand-duped for now
            /*$('.datasets-list-sorting select, .datasets-list-sorting input').each(function(){
                $(this).clone().appendTo('#datasets-filter-form .hidden-options');
            });*/

            // No longer needed with new faceted nav product
            // $('.datasets-list-sorting select').change(function(){
            //     var selection = $(this).val();
            //     $('#datasets-filter-form .hidden-options select.'+$(this).data('field-class')+' option').filter(function(){
            //         return ($(this).val() == selection);
            //     }).prop('selected', true);
            //     $('#datasets-filter-form').submit();
            // });
            
            // check for Firefox to avoid ZIP issue
            if(typeof InstallTrigger !== 'undefined' == true){
                $('.bccvl-main .alert').after('<div class="alert alert-block alert-error fade in">'+
                    '<button type="button" class="close" data-dismiss="alert">×</button>'+
                    '<h4 class="alert-heading">Features on this page are incompatible with Firefox</h4>'+
                    '<p>Currently there are issues preventing the use of Firefox in submitting this experiment type.  The BCCVL support team are working to resolve them, but recommend using <a href="https://www.google.com/chrome/browser/desktop/" target="_blank">Google Chrome</a> as your browser for the BCCVL until further notice.</p>'+
                '</div>');
            }

            // Identify datasets that are currently importing.
            // These are the spinner icons.
            var datasets_timer = function() {
                var timer_id = null;
                var spinner_sel = '.dataset-import';

                function update_dataset_row() {
                    // poll all active spinners and update dataset row if completed
                    $.each($(spinner_sel), function(i, spinner) {

                        bccvlapi.job.state({uuid: $(spinner).data('uuid')}).then(
                            function(status) {
                                if (status == 'COMPLETED' || status == 'FAILED') {
                                    // The import is complete, now render the row.
                                    var datasetURL = $(spinner).attr('data-url');
                                    var completeURL = datasetURL + '/@@datasets_list_item';
                                    renderDatasetRow(completeURL, $(spinner).parents('.datasets-list-entry'));
                                }
                            }
                        );
                        
                    });
                    // restart timer if there are any spinners left
                    if ($(spinner_sel).length) {
                        timer_id = window.setTimeout(update_dataset_row, 5000);
                    }
                }

                $(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_SUCCESS, function(evt) {
                    // clear current timeout
                    if (timer_id) {
                        window.clearTimeout(timer_id);
                    }
                    if ($(spinner_sel).length) {
                        timer_id = window.setTimeout(update_dataset_row, 5000);
                    }
                });
                
            }();
            
            $("body").on("click", ".update-dataset-btn", function(event) {
                event.preventDefault();
                var datasetURL = $(this).attr('data-url');
                var completeURL = datasetURL + '/@@datasets_list_item';
                var dsRow = $(this).parents('.datasets-list-entry');
                var uuid = dsRow.data('uuid')
                bccvlapi.dm.update_metadata(uuid).then(
                    function() { 
                        renderDatasetRow(completeURL, dsRow);
                    }
                ).then(
                    function() { 
                        $(Faceted.Events).trigger(Faceted.Events.AJAX_QUERY_SUCCESS);
                    }
                );
            });

            // Dateset entry dropdown functions
            $('body').on('click', '.dropdown-button', function(event){
                event.preventDefault();
                var el = $(this);
                $('.dropdown-button i:first-child').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                // if a user clicks on the dropdown button on a dataset thats already open
                if (el.hasClass('open')){
                    $('div.preview-dropdown:visible').slideUp(300, function(){
                        el.prev('.bccvl-list-preview-pane').html('');
                    });
                    el.find('i:first-child').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                    el.removeClass('open');
                } else {
                    // if a dataset is already open
                    if($('div.preview-dropdown:visible').length != 0){
                        var existingMap = $('div.preview-dropdown:visible').find('.bccvl-list-preview-pane');
                        $('div.preview-dropdown:visible').slideUp(300, function(){
                            $('.dropdown-button').removeClass('open');
                            existingMap.html('');
                            el.prev('.bccvl-list-preview-pane').html('');
                            el.prev('div.preview-dropdown').slideDown(300, function(){
                                $('html,body').animate({
                                    scrollTop: (el.parents('div.datasets-list-entry').offset().top - 10)
                                }, 1000);
                            });
                            el.addClass('open');
                            $('div.preview-dropdown:visible').find('.bccvl-list-occurrence-viz, .bccvl-list-absence-viz, .bccvl-list-auto-viz').trigger('click');
                        });
                    } // if no datasets are open yet
                    else {
                        el.prev('div.preview-dropdown').slideDown(300, function(){
                            $('html,body').animate({
                                scrollTop: (el.parents('div.datasets-list-entry').offset().top - 10)
                            }, 1000);
                            el.addClass('open');
                            $('div.preview-dropdown:visible').find('.bccvl-list-occurrence-viz, .bccvl-list-absence-viz, .bccvl-list-auto-viz').trigger('click');
                        });
                    }
                    el.find('i:first-child').removeClass('icon-chevron-down').addClass('icon-chevron-up');

                }

            });

            // modal preview
            $('body').on('click', '.bccvl-modal-occurrence-viz, .bccvl-modal-auto-viz', function(event){
                event.preventDefault();
                var el = $(this);

                $('body').append('<div class="modal hide fade" id="preview-dataset-modal" tabindex="-1" role="dialog" aria-labelledby="meta-modal" aria-hidden="true"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h3 id="meta-modal">'+el.data('title')+'</h3></div><div class="modal-body"><span class="loading-gif" style="margin:3m 0;"></span></div></div>');

                $('#preview-dataset-modal').modal();

                $('#preview-dataset-modal').on('show', function(){
                    // this event refuses to fire for some reason
                    $(this).find('.modal-body').height(''+(window.innerHeight*0.75)+'px');
                });

                $('#preview-dataset-modal').on('shown', function(){

                    $(this).find('.modal-body').height(''+(window.innerHeight*0.75)+'px');

                    $('#preview-dataset-modal .modal-body').html('<div class="bccvl-modal-preview-pane" id="modal-map-'+el.data('uuid')+'"></div>');
                    
                    if (el.hasClass('bccvl-modal-occurrence-viz')){
                        var params = {
                            'type': 'occurrence',
                            'mimetype': el.data('mimetype'),
                            'genre': el.data('genre')
                        }

                        vizcommon.mapRender(el.data('uuid'), el.attr('href'), 'modal-map-'+el.data('uuid')+'', params);
                    } else {
                        var params = {
                            'type': 'auto',
                            'mimetype': el.data('mimetype'),
                            'genre': el.data('genre')
                        }
                        if (params.mimetype == 'text/csv' || (params.genre == 'DataGenreTraits' && params.mimetype == 'application/zip' )){
                            console.log('traits as zip');
                            vizcommon.renderCSV(el.data('uuid'), el.attr('href'), 'modal-map-'+el.data('uuid')+'', params);
                        } else {
                            vizcommon.mapRender(el.data('uuid'), el.attr('href'), 'modal-map-'+el.data('uuid')+'', params, el.data('viz-layer'));
                        }
                    }
                }); 

                $('#preview-dataset-modal').on('hidden', function(){
                    $('#preview-dataset-modal').remove();
                });
                // setup popover handling in modal (bootstrap does not initialise dynamically loaded popovers inside modals?)
                $('#preview-dataset-modal .modal-body').popover({
                    'selector': '[data-toggle="popover"]',
                    'container': 'body', // bug in bootstrap :( only works as data-attribute when using selector
                    'trigger': 'hover'
                }).on('shown', function(e) { // prevent shared popover/modal events from bubbling up to modal
                    e.stopPropagation();
                }).on('hidden', function(e) {
                    e.stopPropagation();
                });


                
            });

            // Request metadata for datasets
            // These buttons have a fallback to open their request in a new tab (if JS is disabled)
            var infomodal = new modals.InfoModal('info-modal');
            infomodal.bind('body', "[data-toggle='InfoModal']");
            var removemodal = new modals.RemoveModal('remove-modal');
            removemodal.bind('body', 'a.remove-dataset-btn');
            var sharingmodal = new modals.SharingModal('sharing-modal');
            sharingmodal.bind('body', 'a.sharing-btn');
            var layereditmodal = new modals.LayerEditModal('layeredit-modal');
            layereditmodal.bind('body', 'a.environmentallayers-zip-edit');

            $('body').on('click', 'a.ala-edit', function(event) {
                event.preventDefault();
                var el = $(this);
                var dsuuid = el.data('uuid')
                bccvlapi.dm.export_to_ala(dsuuid).then(
                    function(data, status, jqxhr) {
                        // TODO: could also change button and let user decide when to go to Spatial Portal
                        window.location = data.sandboxUrl
                    },
                    function(jqxhr) {
                        var data = jqxhr.responseJSON
                        var errors = []
                        for (var i=0; i < data.errors.length; i++) {
                            errors.push(data.errors[i].title);
                        }
                        alert('Export To ALA failed\n' + errors.join('\n'))
                    }
                );
            });
            
        });
        
        function renderDatasetRow(completeURL, $tr) {
            return $.ajax({
                url: completeURL,
                success: function(rowHTML) {
                    $tr.replaceWith($(rowHTML));
                }
            });
        };

    }
);
