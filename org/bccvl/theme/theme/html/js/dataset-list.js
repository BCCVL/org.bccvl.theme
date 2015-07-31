//
// main JS for the dataset list page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-visualiser-map',
     'js/bccvl-sharing-modal', 'js/layer-edit-modal', 'js/bccvl-remove-dataset-modal', 'openlayers3',
     'bootstrap', 'jquery-tablesorter', 'jquery-form', 'jquery-timer', 'selectize'],
    function($, viz, vizmap, sharing, editmodal, removedataset) {

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
                plugins: ['remove_button']
            });

            // duplicate top bar filters as hidden fields in the filters form
            // wont set after being created, something wrong with the dom, has to be hand-duped for now
            /*$('.datasets-list-sorting select, .datasets-list-sorting input').each(function(){
                $(this).clone().appendTo('#datasets-filter-form .hidden-options');
            });*/

            $('.datasets-list-sorting select').change(function(){
                var selection = $(this).val();
                $('#datasets-filter-form .hidden-options select.'+$(this).data('field-class')+' option').filter(function(){
                    return ($(this).val() == selection);
                }).prop('selected', true);
                $('#datasets-filter-form').submit();
            });

            // Identify datasets that are currently importing.
            // These are the spinner icons.
            $.each($('i.dataset-import'), function(i, spinner) {
                var datasetURL = $(spinner).attr('data-url');
                var pollURL = datasetURL + '/jm/getJobStatus';
                var completeURL = datasetURL + '/@@datasets_list_item';

                // Start a timer that does the polling
                var timer = $.timer(function() {
                    $.ajax({
                        url: pollURL,
                        success: function(status) {
                            if (status == 'COMPLETED' || status == 'FAILED') {
                                timer.stop();
                                // The import is complete, now render the row.
                                renderDatasetRow(completeURL, $(spinner).parents('.datasets-list-entry'));
                            }
                        }
                    });
                });
                timer.set({
                    time: 5000,
                    autostart: true
                });
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
