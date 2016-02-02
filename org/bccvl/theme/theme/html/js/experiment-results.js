//
// main JS for the experiment results page.
//
define(
    ['jquery', 'js/bccvl-visualiser-map', 'js/bccvl-visualiser-common', 'openlayers3', 'bootstrap'],
    function( $, vizmap, vizcommon, ol ) {
        // ==============================================================
        var intervalID;
        $(function() {

            var geojsonObject = $('#form-widgets-modelling_region').val();

            if (geojsonObject) {

                var source = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
                });

                var constraintsLayer = new ol.layer.Vector({
                    source: source,
                    type: 'constraint',
                    title: 'Input region',
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(0, 160, 228, 0.0)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 160, 228, 0.9)',
                            width: 2
                        })
                    })
                });
                
                var constraints = new ol.layer.Group({
                    title: 'Constraints',
                    layers: [constraintsLayer]
                }); 

                // temp fix to wipe common listener off button on this page
                $('body a.bccvl-auto-viz').unbind('click');
                // and redo it
                $('body').on('click', 'a.bccvl-auto-viz', function(event){

                    var type = $(this).data('mimetype');

                    if (type == 'image/geotiff'){
                        $.when(vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'))).then(function(map, visLayers) {
                            
                            map.addLayer(constraints);

                        });
                    }
                });
            }


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
            
            $('.bccvl-experimenttable-accordion').on('hide', function(){
                $(this).find('.expand-btn').html('<i class="fa fa-chevron-circle-down icon-link"></i> More');
            }).on('show', function(){
                $(this).find('.expand-btn').html('<i class="fa fa-chevron-circle-up icon-link"></i> Less');
            });
            
            /*$('.expand-btn').toggle(function(e){
                $(this).parents('.bccvl-experimenttable-accordion').find('.collapse').slideDown(300);
                $(this).find('.expand-btn').html('<i class="fa fa-chevron-circle-up icon-link"></i> Less');
            }, function(e){
                $(this).parents('.bccvl-experimenttable-accordion').find('.collapse').slideUp(300);
                $(this).find('.expand-btn').html('<i class="fa fa-chevron-circle-down icon-link"></i> More');
            });*/

            $('a.export-btn').click( function(event ) {
                event.preventDefault();
                
                var url = $(this).attr('href');
                var $modal = $('#oauth-select-modal');
                console.log(url);
                $modal.modal();

                $.ajax( {
                    url: url,
                    timeout: 15000,
                    context: $modal.context, // make this available in callbacks
                    beforeSend: function( xhr ) {
                        $(this).find('.spinner').show();
                    },                    
                  })
                  .done(function(data) {
                      $(this).find('.modal-content').html(data);
                  })
                  .fail(function(jqXHR, textStatus) {
                    if (textStatus == "timeout"){
                        console.log('request for oauths timed out.')
                    } else {
                        console.log(textStatus);
                        $('#oauth-select-modal').find('.modal-content').html('<div class="alert alert-warning"><p><strong>Error requesting authorisations.</strong></p><p>Please try again later.  If the issue persists, contact our support staff via bccvl.org.au.</p>');
                    }
                  })
                  .always(function() {
                      console.log('oauth modal triggered');
                      $(this).find('.spinner').hide();
                  });
            });

            $('a.email-support-btn').click( function(event ) {
                event.preventDefault();
                
                var url = $(this).attr('href');
                $.ajax( {
                    url: url,
                    timeout: 10000
                }).done(function(data) {
                    var msg = '<div class="alert alert-block alert-info"><button type="button" class="close" data-dismiss="alert">&times;</button><p><strong>' + data["message"] + '</strong></p></div>';
                    $('.bccvl-flashmessages').append(msg);
                    console.log('Success: ' + data["success"] + ', Message: ' + data["message"]);
                    if (data["success"]){
                        $('a[class$="email-support-btn"][href="' + url + '"]').attr("disabled", true);
                    }
                });
            });

            $('#oauth-select-modal').on('hidden', function(){
                $(this).removeData('modal');
                $(this).find('.modal-content').empty();
            });
        });

        // CUSTOM AFFIX, BOOTSTRAP 2.3.2 IS BORKED.
        if (window.innerWidth > 767 && $('.affixed-map').length > 0){
            setupAffix();
        }
        
        function setupAffix() {
            var affix = $('.affixed-map');
            var offsetTop = affix.offset().top;
            var offsetLeft = affix.offset().left;
            var affixWidth = affix.innerWidth() - 10;
            var affixHeight = affix.outerHeight();

            affix.css({
                'max-height': affixHeight,
                'overflow-y': 'auto'
            });

            $(window).scroll(function(){
                if( ($(window).scrollTop() - 15) > offsetTop) {
                    affix.addClass('affix');
                    affix.css({
                        'left': offsetLeft,
                        'width': affixWidth
                    });
                } else {
                    affix.removeClass('affix');
                }
            });
        }

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
