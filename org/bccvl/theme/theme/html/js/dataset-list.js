
//
// main JS for the dataset list page.
//
define(     ['jquery',  'js/bccvl-stretch', 'js/bccvl-visualiser', 'js/bccvl-sharing-modal', 'js/layer-edit-modal', 'bootstrap', 'jquery-tablesorter', 'jquery-form'],
  function(   $      ,   stretch          ,  viz                 ,  sharing                ,  editmodal) {
  // ==============================================================
    $(function() {

      viz.init();
      stretch.init({ topPad: 60, bottomPad: 10 });
      sharing.init();
      editmodal.init();

      $('.bccvl-datasetstable').tablesorter({
        headers: {
            2: { sorter: false } // should be link column
        },
            sortList: [[0,1]]
      });

      // Polling starts here
      if ($('.dataset-import').length > 0) {
        pollImportStatus();
        var pollID = window.setInterval(pollImportStatus, 5000);
      }
    });

    function pollImportStatus(pollID) {
      var $datasets = $('.dataset-import');

      $datasets.each(function (){
        var dataset = $(this)
        var dataUrl = dataset.attr('data-url');

        var jmUrl = dataUrl + '/jm/getJobStatus'

        $.ajax({
          url: jmUrl,
          success: function (data) {

            var completed = false;

            var jobStatus = data;

            if (jobStatus == 'COMPLETED') {
                completed = true;
            } else if (jobStatus == 'FAILED') {
                completed = true;
            } else if (jobStatus == null) {
                return;
            } else {
                completed = false;
            }
            if (completed) {
                dataset.removeClass('bccvl-small-spinner');
                dataset.removeClass('dataset-import');

                generateControlButtons(dataset);
            } else {
                dataset.addClass('bccvl-small-spinner');
            }

          }
        });
      })
    }

    function generateControlButtons(dataset) {
      var $controlGroup = dataset.parent();
      var $tableLabel = $controlGroup.parent().find('.bccvl-table-label');
      var dataUrl = dataset.attr('data-url');
      var dmUrl = dataUrl + '/dm/getMetadata'

      $.ajax({
        url: dmUrl,
        async: false,
        success: function (data) {
          var downloadButtonHTML = '<a href="' + data.file + '"><i class="icon-circle-arrow-down" title="download"></i></a>';
          var publishButtonHTML = '<a href="' + data.url + '/dm/publish"><i class="icon-share-alt" title="Publish"></i></a>';
          var sharingButtonHTML = '<a class="sharing-btn" href="' + data.url + '/@@sharing"><i class="icon-share" title="Sharing Options"></i></a>';
          if (data.mimetype == 'text/csv') {
            var visualiseButtonHTML = '<a href="#" class="bccvl-occurrence-viz" data-viz-id="' + data.vizurl + '"><i class="icon-eye-open icon-link" title="preview"></i></a>';
          }
          else {
            var visualiseButtonHTML = '<a href="#" class="bccvl-auto-viz" data-viz-id="' + data.vizurl + '"><i class="icon-eye-open icon-link" title="preview"></i></a>';
          }
          var descriptionHTML = '<p>' + data.description + '</p>';
          $controlGroup.append(publishButtonHTML);
          $controlGroup.append(sharingButtonHTML);
          $controlGroup.append(downloadButtonHTML);
          $controlGroup.append(visualiseButtonHTML);
          var $descriptionField = $tableLabel.find("p");
          $descriptionField.replaceWith(descriptionHTML);
          viz.init();
          sharing.init();
        }
      });
    }

  // ==============================================================
  }
);
