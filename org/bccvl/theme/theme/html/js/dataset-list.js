//
// main JS for the dataset list page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-visualiser-map',
     'js/bccvl-sharing-modal', 'js/layer-edit-modal', 'js/bccvl-remove-dataset-modal', 'openlayers3',
     'bootstrap', 'jquery-tablesorter', 'jquery-form', 'selectize', 'faceted_view.js', 'bbq', 'js/selectize-remove-single'],

    function($, viz, vizmap, sharing, editmodal, removedataset) {

        $(window).load(function(evt) {
            Faceted.Load(evt, window.location.origin+window.location.pathname+'/');
        });
        $(window).unload(function() {
            Faceted.Unload();
        });
        
        // ==============================================================
        $(function() {

            viz.init();
            sharing.init();
            editmodal.init();
            removedataset.init();


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

            // Identify datasets that are currently importing.
            // These are the spinner icons.
            var datasets_timer = function() {
                var timer_id = null;
                var spinner_sel = '.dataset-import';

                function update_dataset_row() {
                    // poll all active spinners and update dataset row if completed
                    $.each($(spinner_sel), function(i, spinner) {
                        var datasetURL = $(spinner).attr('data-url');
                        var pollURL = datasetURL + '/jm/getJobStatus';
                        var completeURL = datasetURL + '/@@datasets_list_item';
                        
                        // poll status of dataset import
                        $.ajax({
                            url: pollURL,
                            success: function(status) {
                                if (status == 'COMPLETED' || status == 'FAILED') {
                                    // The import is complete, now render the row.
                                    renderDatasetRow(completeURL, $(spinner).parents('.datasets-list-entry'));
                                }
                            }
                        });
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

                $('#preview-dataset-modal').on('shown', function(){
                    $('#preview-dataset-modal .modal-body').html('<div class="bccvl-modal-preview-pane" id="modal-map-'+el.data('uuid')+'"></div>');
                    if ($(this).hasClass('bccvl-list-occurrence-viz')){
                        vizmap.mapRender(el.data('uuid'), el.data('viz-id'), 'modal-map-'+el.data('uuid')+'', 'occurence');
                    } else {
                        vizmap.mapRender(el.data('uuid'),el.data('viz-id'), 'modal-map-'+el.data('uuid')+'', 'auto', el.data('viz-layer'));
                    }
                }); 

                $('#preview-dataset-modal').on('hidden', function(){
                    $('#preview-dataset-modal').remove();
                });
                // setup popover handling in modal
                $('#preview-dataset-modal .modal-body').popover({
                    'selector': '[data-toggle="popover"]',
                    'container': '#preview-dataset-modal', // bug in bootstrap :( only works as data-attribute when using selector
                    //'container': '#preview-dataset-modal .modal-body',
                    //'container':  'div.modal-backdrop',
                    'trigger': 'hover'
                }).on('shown', function(e) { // prevent events from bubbling up to modal
                    e.stopPropagation();
                }).on('hidden', function(e) {
                    e.stopPropagation();
                });


                
            });

            // Request metadata for datasets
            // These buttons have a fallback to open their request in a new tab (if JS is disabled)
            $('body').on('click', '.dataset-info-btn', function(event){
                event.preventDefault();
                var requestUrl = $(this).attr('href');
                $('body').append('<div class="modal hide fade" id="dataset-meta-modal" tabindex="-1" role="dialog" aria-labelledby="meta-modal" aria-hidden="true"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h3 id="meta-modal">Dataset Metadata</h3></div><div class="modal-body"><span class="loading-gif"></span></div><div class="modal-footer"><button class="btn" data-dismiss="modal" aria-hidden="true">Close</button></div></div>');
                $.ajax(requestUrl)
                    .done(function(data){
                        console.log(data);
                        $('#dataset-meta-modal .modal-body').fadeOut(300, function(){
                            $('#dataset-meta-modal .modal-body').html(data);
                            $('#dataset-meta-modal .modal-body').fadeIn(300);
                        });
                    })
                    .fail(function() {
                        $('#dataset-meta-modal .modal-body').fadeOut(300, function(){
                            $('#dataset-meta-modal .modal-body').html('<h1>No metadata is available for this dataset at this time.</h1>');
                            $('#dataset-meta-modal .modal-body').fadeIn(300);
                        });
                    });
                $('#dataset-meta-modal').modal();
                $('#dataset-meta-modal').on('hidden', function(){
                    $('#dataset-meta-modal').remove();
                });
            });

        });

        function renderDatasetRow(completeURL, $tr) {
            $.ajax({
                url: completeURL,
                success: function(rowHTML) {
                    $tr.replaceWith($(rowHTML));
                    // Wire up visualiser and sharing
                    viz.init();
                    sharing.init();
                    removedataset.init();
                }
            });
        };

    }
);
