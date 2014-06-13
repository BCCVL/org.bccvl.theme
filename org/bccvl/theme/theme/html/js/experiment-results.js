
//
// main JS for the experiment results page.
//
define(     ['jquery', 'js/bccvl-stretch', 'js/bccvl-visualiser', 'bootstrap'],
    function( $,        stretch          ,  viz ) {
    // ==============================================================
        var intervalID;
        $(function() {

          stretch.init({ topPad: 60, bottomPad: 10 });
          viz.init();

          // Check to see if the experiment is already completed or not before start polling
          var experimentStatus = $(".bccvl-expstatus").attr('data-status');

          if ( experimentStatus != 'COMPLETED' && experimentStatus != 'FAILED'){
            pollExperimentStatus();
            // Continue to poll until all algorithms are done
            intervalID = window.setInterval(pollExperimentStatus, 5000);
          }
        });

        // Poll /jm/getJobStatus for the status of the experiments
        // This endpoint returns the status of each algorithm
        function pollExperimentStatus() {
          var url = document.URL.replace(/#.*$/, '').replace('/view', '') + '/jm/getJobStates'

          // ajax call
          $.get(url).done(function(data){

            if (data == undefined || data == null || data.length == 0) {
              return;
            }

            var queuedAlgorithms = [];
            var runningAlgorithms = [];
            var failedAlgorithms = [];
            var completedAlgorithms = [];

            var completed = true;
            var running = false;
            var html = '';

            data.forEach(function(job){

              var algorithm = job[0];
              var status = job[1];
              var icon;

              // Failed, Transferring, Running, Retrieving, Completed, Cleanup and Queued

              // Creates the html for the Algorithm and icon representing the status
              if (status != 'COMPLETED' && status != 'FAILED') {
                completed = false;
              }

              if (status == 'QUEUED') {
                queuedAlgorithms.push(algorithm);
              }
              else if (status == 'FAILED'){
                failedAlgorithms.push(algorithm);
              }
              else if (status == 'COMPLETED'){
                completedAlgorithms.push(algorithm);
              }
              else {
                running = true;
                runningAlgorithms.push(algorithm);
              }
            })

            // do the maths for the progress bar

            var numAlgorithms = queuedAlgorithms.length + runningAlgorithms.length + failedAlgorithms.length + completedAlgorithms.length;

            var queuedPercentage = (queuedAlgorithms.length / numAlgorithms * 100).toString() + '%';
            var runningPercentage = (runningAlgorithms.length / numAlgorithms * 100).toString() + '%';
            var failedPercentage = (failedAlgorithms.length / numAlgorithms * 100).toString() + '%';
            var completedPercentage = (completedAlgorithms.length / numAlgorithms * 100).toString() + '%';

            // unhide the progress bar
            $('.progress').removeClass('hidden');

            // update the text inside the bars
            $('#bar-queued').text(queuedAlgorithms.length.toString() + ' QUEUED');
            $('#bar-running').text(runningAlgorithms.length.toString() + ' RUNNING');
            $('#bar-failed').text(failedAlgorithms.length.toString() + ' FAILED');
            $('#bar-completed').text(completedAlgorithms.length.toString() + ' COMPLETED');

            // update the widths accordingly
            $('#bar-queued').css('width', queuedPercentage);
            $('#bar-running').css('width', runningPercentage);
            $('#bar-failed').css('width', failedPercentage);
            $('#bar-completed').css('width', completedPercentage);

            if (!completed) {
              if (running) {
                $(".alert-queued-text").empty()
                $(".alert-queued-text").text('running')
              }
            }
            else {
              // stop the polling
              clearInterval(intervalID);
              // refresh the page when the experiment is completed
              location.reload();
            }

          })

        }

    // ==============================================================
    }
);
