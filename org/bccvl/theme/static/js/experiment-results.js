
//
// main JS for the experiment results page.
//
define(     ['jquery', 'js/bccvl-stretch', 'js/bccvl-visualiser', 'bootstrap'],
    function( $,        stretch          ,  viz ) {
    // ==============================================================
        $(function() {

          stretch.init({ topPad: 60, bottomPad: 10 });
          viz.init();
          
          // Check to see if the experiment is already completed or not before start polling
          var experimentStatus = $(".bccvl-expstatus").attr('data-status');
          if ( experimentStatus != 'Completed' && experimentStatus != 'Failed'){
            pollExperimentStatus();
            // Continue to poll until all algorithms are done
            var intervalID = window.setInterval(pollExperimentStatus, 5000);
          }
        });

        // Poll /jm/getJobStatus for the status of the experiments
        // This endpoint returns the status of each algorithm
        function pollExperimentStatus() {
          var url = document.URL.replace('/view', '') + '/jm/getJobStatus'

          // ajax call
          $.get(url).done(function(data){

            var completed = true;
            var running = false;
            var html = '';

            data.forEach(function(job){
              var algorithm = job[0];
              var status = job[1];
              var icon;

              // Creates the html for the Algorithm and icon representing the status
              if (status != 'Completed' && status != 'Failed'){
                completed = false;
                icon = '<i class="bccvl-small-spinner" title="' + status + '"></i>'
              } 
              else if (status == 'Completed') {
                icon = '<i class="icon-ok" title="Completed"></i>'
              }
              else {
                icon = '<i class="icon-exclamation-sign" title="Failed"></i>'
              }

              // Determine if there are any running algorithms
              if (status == 'Running'){
                running = true;
              }

              html += '<span>' + algorithm + ': ' + icon + '</span>';
            })

            html = '<div class="algorithm-status">' + html + '</div>'

            // update the status in html
            if (html != ''){
              $(".algorithm-status").remove();
              $(".bccvl-expstatus").append(html);  
            }

            if (!completed){
              if (running){
                $(".alert-queued-text").empty()
                $(".alert-queued-text").text('running')
              }
            }
            else {
              // refresh the page when the experiment is completed
              location.reload(); 
            }

          })
          
        }

    // ==============================================================
    }
);