
//
// main JS for the dataset list page.
//
define(     ['jquery',  'js/bccvl-preview-layout', 'js/bccvl-visualiser', 'js/bccvl-sharing-modal', 'js/layer-edit-modal', 'bootstrap', 'jquery-tablesorter', 'jquery-form', 'jquery-timer'],
  function(   $      ,   preview_layout          ,  viz                 ,  sharing                ,  editmodal) {
  // ==============================================================
  $(function() {

        viz.init();
        sharing.init();
        editmodal.init();

        $('.bccvl-datasetstable').tablesorter({
            headers: {
                2: { sorter: false } // should be link column
            },
            sortList: [[0,1]]
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
                            renderDatasetRow(completeURL, $(spinner).parents('tr'));
                        }
                    }
                });
            });
            timer.set({
                time: 5000,
                autostart: true,
            });
        });
    });

    function renderDatasetRow(completeURL, $tr) {
        $.ajax({
            url: completeURL,
             success: function(rowHTML) {
                $tr.html($(rowHTML).children());
                // Wire up visualiser and sharing
                viz.init(); 
                sharing.init();
            }
        });
    }

});
