//
// main JS for the new projection experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation', 'js/bccvl-form-validator', 'jquery-tablesorter'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          , fadeaway           ,  dimensions                  ,  formvalidator) {
    // ==============================================================
        // global list for projection validation
        var cachedProjectionDatasets = [];
        // do the work
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();

            // init the fadeaway instructions
            fadeaway.init();

            // init the dimension chooser thingy
            // dimensions.init();

            // hook up the wizard buttons
            wiztabs.init();

            // init the table sorter
            $('.bccvl-datasetstable').tablesorter({
                headers: {
                    0: { sorter: false }, // radio box
                    2: { sorter: 'text' }
                },
                sortList: [[1,1]]
            });

            // validate onload since some fields may already be filled in
            validateProjection();

            // bind listeners on the checkboxes in the Projection tab
            $("[id^=form-widgets-years-]").change(function () {
                validateProjection();
            });

            $("[id^=form-widgets-emission_scenarios-]").change(function () {
                validateProjection();
            });

            $("[id^=form-widgets-climate_models-]").change(function () {
                validateProjection();
            });
        });


        // This calls /dm/getFutureClimateDatasets - which currently returns the number of available
        // datasets in the system with the selected filters.
        // Added a cache like logic to speed things up.
        function validateProjection() {
            var checkedYears = $("[id^=form-widgets-years-]:checked");
            var checkedEmissionScenarios = $("[id^=form-widgets-emission_scenarios-]:checked");
            var checkedClimateModels = $("[id^=form-widgets-climate_models-]:checked");

            var yearKey, emissionScenarioKey, climateModelKey;

            var numDatasets = 0;
            var combinations = [];

            // get a list of combinations
            checkedYears.each(function (yearIndex) {
                var year = $(this);

                checkedEmissionScenarios.each(function (emissionIndex) {
                    var emissionScenario = $(this);

                    checkedClimateModels.each(function (climateModelIndex) {
                        var climateModel = $(this);
                        yearKey = year.attr('name');
                        emissionScenarioKey = emissionScenario.attr('name');
                        climateModelKey = climateModel.attr('name');

                        var datasetParams = {};
                        datasetParams[yearKey] = year.attr('value');
                        datasetParams[emissionScenarioKey] = emissionScenario.attr('value');
                        datasetParams[climateModelKey] = climateModel.attr('value');
                        console.log(climateModel.attr('value'))
                        combinations.push(datasetParams);
                    })

                })

            })

            // make ajax call to the endpoint with each combination
            // endpoint returns a int value of the number of datasets available
            if (combinations.length > 0) {
                combinations.forEach(function(datasetParams) {
                    var isCached = false;

                    // If we've already done the ajax call then don't do it again.
                    cachedProjectionDatasets.forEach(function(cachedDataset) {
                        if (datasetParams[yearKey] == cachedDataset[yearKey] &&
                            datasetParams[emissionScenarioKey] == cachedDataset[emissionScenarioKey] &&
                            datasetParams[climateModelKey] == cachedDataset[climateModelKey]) {
                            numDatasets += cachedDataset['numberOfAvailableDatasets'];
                            isCached = true;
                        }
                    })

                    if (!isCached) {
                        $.ajax({
                            url: portal_url + '/dm/getFutureClimateDatasets',
                            data: datasetParams,
                            async: false,
                            success: function (data) {
                                numDatasets += data;

                                // store data so we don't need to call this again for these params
                                datasetParams['numberOfAvailableDatasets'] = data;
                                cachedProjectionDatasets.push(datasetParams);
                            }
                        });
                    }
                });
            }

            // Update the number displayed on the page.
            $('.bccvl-available-projections').text(numDatasets);
            // Get rid of error validation
            if (numDatasets > 0) {
                $('.bccvl-projections-counter').removeClass('control-group error');
                $('.projection-error-message').addClass('hidden');
            }
        }
    // ==============================================================
    }
);
