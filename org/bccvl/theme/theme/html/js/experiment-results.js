//
// main JS for the experiment results page.
//
define(
    ['jquery', 'bccvl-visualiser-map', 'bccvl-visualiser-common', 'openlayers', 'bccvl-modals', 'bccvl-api'],
    function( $, vizmap, vizcommon, ol, modals, bccvlapi) {
        // ==============================================================
        $(function() {

            var infomodal = new modals.InfoModal('info-modal');
            infomodal.bind('body', "[data-toggle='InfoModal']");
            var removemodal = new modals.RemoveModal('remove-modal');
            removemodal.bind('body', 'a.remove-experiment-btn');
            var sharingmodal = new modals.SharingModal('sharing-modal');
            sharingmodal.bind('body', 'a.sharing-btn');
            var exportmodal = new modals.OAuthSelectModal('oauth-select-modal');
            exportmodal.bind('body', 'a.export-btn');

            // trait dataset parameter configuration
            var paramsCount = $("input[name='form.widgets.species_traits_dataset_params.count']").val();
            var speciesDataset = $('#formfield-form-widgets-species_traits_dataset');
            if (paramsCount && speciesDataset) {
                var speciesParamsDiv = '<div class="control-group" data-fieldname="form.widgets.species_traits_dataset_params" id="formfield-form-widgets-species_traits_dataset_params"><label for="form-widgets-species_traits_dataset_params" class="control-label">Trait Dataset Configuration</label></div>';
                for (var i = 0; i < paramsCount; i++) {
                    var pname = sprintf("input[name='form.widgets.species_traits_dataset_params.key.%s']", i);
                    var pvalue = sprintf("input[name='form.widgets.species_traits_dataset_params.%s']", i);
                    speciesParamsDiv += sprintf('<ul><li>%s - %s</li></ul>', $(pname).val(), $(pvalue).val());
                }
                speciesDataset.after(speciesParamsDiv);
            }

            var geojsonId = '#form-widgets-modelling_region';
            var geojsonObject = $(geojsonId).val();
            if (geojsonObject == undefined) {
                geojsonId = '#form-widgets-projection_region';
                geojsonObject = $(geojsonId).val();
            }

            if (geojsonObject) {
                // parse json
                geojsonObject = JSON.parse(geojsonObject);
                var source = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
                });

                // Display the contraint region properties
                var regionParamsDiv = '<div class="control-group" name="region_constraint_properties" id="region_constraint_properties"><label for="region_constraint_properties" class="control-label">Region Constraint Configuration</label></div>';
                var properties = geojsonObject.properties;
                if (properties != undefined) {
                    for (var pname of ['constraint_method', 'region_offset', 'region_type', 'region_name']) {
                        if (properties.hasOwnProperty(pname)) {
                            if (pname == 'region_offset') {
                                regionParamsDiv += sprintf('<ul><li>%s: %s</li></ul>', pname, properties[pname]);
                            }
                            else {
                                regionParamsDiv += sprintf('<ul><li>%s: %s</li></ul>', pname, properties[pname].title);
                            }
                        }
                    }
                }
                $(geojsonId).after(regionParamsDiv);

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

                // add constraints layer to map after map instance has been created
                $('body').on('map_created', function(e, map, params) {
                    if (params.mimetype == 'image/geotiff' || params.mimetype == 'image/tiff') {
                        map.addLayer(constraints);
                    }
                });
            }


            // Check to see if the experiment is already completed or not before start polling
            var experimentStatus = $(".bccvl-expstatus").attr('data-status');

            if ( experimentStatus && experimentStatus != 'COMPLETED' && experimentStatus != 'FAILED'){
                pollExperimentStatus($(".bccvl-expstatus").attr('data-uuid'));
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

            // send support email
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

            // CUSTOM AFFIX, BOOTSTRAP 2.3.2 IS BORKED.
            if (window.innerWidth > 767 && $('.affixed-map').length > 0){
                setupAffix();
            }

        });

        function setupAffix() {
            var affix = $('.affixed-map');
            var offsetTop = affix.offset().top;
            var offsetLeft = affix.offset().left;
            var affixWidth = affix.innerWidth() - 10;
            var affixHeight = affix.outerHeight();

            affix.each(function(){
                var _this = $(this);
                _this.css({
                    'max-height': affixHeight,
                    'overflow-y': 'auto'
                });

                $(window).scroll(function(){

                    if( ($(window).scrollTop() - 15) > offsetTop) {

                        _this.addClass('affix');
                        _this.css({
                            'left': offsetLeft,
                            'width': affixWidth
                        });
                    } else {
                        _this.removeClass('affix');
                    }
                });
            })


        }

        function sprintf(format) {
            for (var i = 1; i < arguments.length; i++) {
                format = format.replace(/%s/, arguments[i]);
            }
            return format;
        }

        // Poll experiment status
        // This endpoint returns the overall experiment status and the status of each algorithm
        function pollExperimentStatus(expuuid) {
            bccvlapi.em.status(expuuid).then(
                function(data) {
                    if (data == undefined || data == null || data.status == undefined || data.status == null) {
                        return;
                    }

                    var queuedAlgorithms = [];
                    var runningAlgorithms = [];
                    var failedAlgorithms = [];
                    var completedAlgorithms = [];
                    var submittingJob = [];

                    var completed = true;
                    var running = false;
                    var html = '';

                    var submitting = true;
                    data.results.forEach( function(job) {

                        var algorithm = job[0];
                        var status = job[1];
                        var icon;

                        // Failed, Transferring, Running, Retrieving, Completed, Cleanup and Queued

                        // Creates the html for the Algorithm and icon representing the status
                        if (status != 'COMPLETED' && status != 'FAILED') {
                            completed = false;
                        }

                        // if (submitting) {
                        //     // First job is the submission job
                        //     submitting = false;
                        //     if (status == 'COMPLETED') {
                        //         completedAlgorithms.push(algorithm);
                        //     }
                        //     else {
                        //         submittingJob.push(algorithm);
                        //     }
                        // }
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

                    var numAlgorithms = queuedAlgorithms.length + runningAlgorithms.length + failedAlgorithms.length + completedAlgorithms.length + submittingJob.length;

                    var queuedPercentage = (queuedAlgorithms.length / numAlgorithms * 100).toString() + '%';
                    var runningPercentage = (runningAlgorithms.length / numAlgorithms * 100).toString() + '%';
                    var failedPercentage = (failedAlgorithms.length / numAlgorithms * 100).toString() + '%';
                    var completedPercentage = (completedAlgorithms.length / numAlgorithms * 100).toString() + '%';
                    var submittedPercentage = (submittingJob.length / numAlgorithms * 100).toString() + '%';

                    // unhide the progress bar
                    $('.progress').removeClass('hidden');

                    // update the text inside the bars
                    $('#bar-queued').text(queuedAlgorithms.length.toString() + ' QUEUED');
                    $('#bar-running').text(runningAlgorithms.length.toString() + ' RUNNING');
                    $('#bar-failed').text(failedAlgorithms.length.toString() + ' FAILED');
                    $('#bar-completed').text(completedAlgorithms.length.toString() + ' COMPLETED');
                    $('#bar-submitted').text(submittingJob.length.toString() + ' SUBMITTING');

                    // update the widths accordingly
                    $('#bar-queued').css('width', queuedPercentage);
                    $('#bar-running').css('width', runningPercentage);
                    $('#bar-failed').css('width', failedPercentage);
                    $('#bar-completed').css('width', completedPercentage);
                    $('#bar-submitted').css('width', submittedPercentage);

                    if (!completed) {
                        if (running) {
                            $(".alert-queued-text").empty();
                            $(".alert-queued-text").text('running');
                        }
                        // call again
                        window.setTimeout(function() {
                            pollExperimentStatus(expuuid)
                        }, 5000)
                    } else {
                        // refresh the page when the experiment is completed
                        location.reload();
                    }
                },
                function(jqXHR) {
                    // error fetching experiment status
                    console.log('Fetching experiment status failed: "', jqXHR.status, '"')
                    window.setTimeout(function() {
                        pollExperimentStatus(expuuid)
                    }, 10000)
                }
            );

        }

        // ==============================================================
    }
);
