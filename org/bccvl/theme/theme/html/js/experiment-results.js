//
// main JS for the experiment results page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-visualiser-map',  'bootstrap'],
    function( $,       viz, vizmap ) {
        // ==============================================================
        var intervalID;
        $(function() {

            //stretch.init({ topPad: 60, bottomPad: 10 });
            viz.init();

            // Check to see if the experiment is already completed or not before start polling
            var experimentStatus = $(".bccvl-expstatus").attr('data-status');

            if ( experimentStatus && experimentStatus != 'COMPLETED' && experimentStatus != 'FAILED'){
                pollExperimentStatus();
                // Continue to poll until all algorithms are done
                intervalID = window.setInterval(pollExperimentStatus, 5000);
            }

            // activate correct tab
            var $urlTab = $('a[href="' + location.hash + '"]');
            if ($urlTab.length > 0) {
                $urlTab.tab('show');
                $urlTab[0].focus(); // convince IE to put focus on the current tab, rather than some random other tab *rolls eyes at IE*
                $urlTab[0].blur();  // then remove the ugly focus rectangle *rolls eyes at IE*
            }


            

            $('a.export-btn').click( function(event ) {
                event.preventDefault();
                
                var url = $(this).attr('href');
                console.log(url);
                $('#oauth-select-modal').modal();

                $.ajax( url )
                  .done(function(data) {
                    console.log(data);
                    if (data.length <= 0) {
                        // this is also a fail
                        $('#oauth-select-modal').find('.modal-body').html('<div class="alert alert-warning"><p><strong>No authorisations for export services found!</strong></p><p>To export your experiment results to an exterior service you must first authorise that service in your user preferences.</p><p>Click the <strong>Manage Authorisations</strong> button below to see your authorisations.</p></div>');
                    } else {
                        $('#oauth-select-modal').find('.modal-body').html(data);
                    }
                  })
                  .fail(function(jqXHR, textStatus) {
                    if (status == "timeout"){
                        console.log('request for oauths timed out.')
                        $('#oauth-select-modal').find('.modal-body').html('<div class="alert alert-warning"><p><strong>Authorisations request timed out.</strong></p><p>Please try again later, or Click the <strong>Manage Authorisations</strong> button below to manage your authorisations.</p></div>');
                    } else {
                        $('#oauth-select-modal').find('.modal-body').html('<div class="alert alert-warning"><p><strong>No authorisations for export services found!</strong></p><p>To export your experiment results to an exterior service you must first authorise that service in your user preferences.</p><p>Click the <strong>Manage Authorisations</strong> button below to see your authorisations.</p></div>');
                  
                    }
                    })
                  .always(function() {
                    console.log('oauth modal triggered');
                  });

                /*.load(url, function (response, status, xhr) {
                    if (status == "success") {
                        $('#oauth-select-modal').find('.modal-body').html(response);
                        console.log('when does this run?');
                    } else if (status == "error"){
                        $('#oauth-select-modal').find('.modal-body').html('<div class="alert alert-warning"><p><strong>No authorisations for export services found!</strong></p><p>To export your experiment results to an exterior service you must first authorise that service in your user preferences.</p><p>Click the <strong>Manage Authorisations</strong> button below to see your authorisations.</p></div>');
                    }
                });*/
            });

            $('#oauth-select-modal').on('hidden', function(){
                $('#oauth-select-modal .modal-body').html('');
            });
        });

        // Poll /jm/getJobStatus for the status of the experiments
        // This endpoint returns the status of each algorithm
        function pollExperimentStatus() {
            var url = document.URL.replace(/#.*$/, '').replace('/view', '') + '/jm/getJobStates';

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
                });

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
                        $(".alert-queued-text").empty();
                        $(".alert-queued-text").text('running');
                    }
                }
                else {
                    // stop the polling
                    clearInterval(intervalID);
                    // refresh the page when the experiment is completed
                    location.reload();
                }

            });

        }

        // ==============================================================
    }
);
