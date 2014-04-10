//
// main JS for the new biodiverse experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-form-validator', 'jquery-tablesorter', 'jquery-arrayutils'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          ,  fadeaway           , formvalidator) {

		$(function() {

			console.log('page behaviour loaded.');

			// hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();

            // init the fadeaway instructions
            fadeaway.init();

            // hook up the wizard buttons
            wiztabs.init();

            // TODO: Remove this when real AJAX endpoint integration is complete.
            var getMockProjectionData = function() {
                projectionData = {
                    "projections": [
                        {
                            "name": "Projection Experiment 1",
                            "id": "312321dsaads3",
                            "species" : [ "Kangaroo", "Emu", "Koala" ],
                            "result": [
                                {
                                    "year": "2015",
                                    "files": [ "proj_1_2015.tif" ]
                                },
                                {
                                    "year": "2025",
                                    "files": [  ]
                                },
                                {
                                    "year": "2035",
                                    "files": [  ]
                                },
                                {
                                    "year": "2045",
                                    "files": [ "proj_1_2045.tif" ]
                                },
                                {
                                    "year": "2055",
                                    "files": [  ]
                                },
                                {
                                    "year": "2065",
                                    "files": [  ]
                                }
                            ]
                        },
                        {
                            "name": "Projection Experiment 2",
                            "id": "4139czfxle1423123",
                            "species" : [ "Kangaroo", "Emu" ],
                            "result": [
                                {
                                    "year": "2015",
                                    "files": [ "proj_2_2015.tif" ]
                                },
                                {
                                    "year": "2025",
                                    "files": [  ]
                                },
                                {
                                    "year": "2035",
                                    "files": [  ]
                                },
                                {
                                    "year": "2045",
                                    "files": [  ]
                                },
                                {
                                    "year": "2055",
                                    "files": [  ]
                                },
                                {
                                    "year": "2065",
                                    "files": [  ]
                                }
                            ]
                        }
                    ]
                };
                return projectionData;
            }

            var renderProjection = function(projectionJSON) {
                var html = '';
                html += '<tr">';
                html +=  '<td class="bccvl-table-choose">';
                html +=   '<input id="proj-' + projectionJSON.id + '" class="bccvl-projection" type="checkbox" data-projectionid="' + projectionJSON.id + '"></input>';
                html +=  '</td>';
                html +=  '<td class="bccvl-table-label">';
                html +=   '<label for="proj-' + projectionJSON.id + '">';
                html +=    '<h1>' + projectionJSON.name + '</h1>';
                html +=   '</label>';
                html +=  '</td>';
                html += '</tr>';
                return html;
            }

            var renderSpecies = function(speciesName) {
                var html = '';
                html += '<tr">';
                html +=  '<td class="bccvl-table-choose">';
                html +=   '<input id="species-' + speciesName + '" class="bccvl-species" type="checkbox" value="' + speciesName + '"></input>';
                html +=  '</td>';
                html +=  '<td class="bccvl-table-label">';
                html +=   '<label for="species-' + speciesName + '">';
                html +=    '<h1>' + speciesName + '</h1>';
                html +=  '</td>';
                html += '</tr>';
                return html;
            }

            var renderYear = function(year) {
                var html = '';
                html += '<tr">';
                html +=  '<td class="bccvl-table-choose">';
                html +=   '<input id="year-' + year + '" class="bccvl-year" type="checkbox" value="' + year + '"></input>';
                html +=  '</td>';
                html +=  '<td class="bccvl-table-label">';
                html +=   '<label for="year-' + year + '">';
                html +=    '<h1>' + year + '</h1>';
                html +=  '</td>';
                html += '</tr>';
                return html;
            }

            var renderLayer = function(layer) {
                var html = '';
                html += '<tr">';
                html +=  '<td class="bccvl-table-choose">';
                html +=   '<input id="layer-' + layer + '" class="bccvl-layer" type="checkbox" value="' + layer + '"></input>';
                html +=  '</td>';
                html +=  '<td class="bccvl-table-label">';
                html +=   '<label for="layer-' + layer + '">';
                html +=    '<h1>' + layer + '</h1>';
                html +=  '</td>';
                html += '</tr>';
                return html;
            }

            // Determines all the selected projections, and returns their JSON objects as an Array.
            var getSelectedProjections = function() {

                // Get all the projection checkboxes that are selected.
                var $selectedProjectionCheckboxes = $('.bccvl-projection').filter(':checked');
                if ($selectedProjectionCheckboxes.length == 0) {
                    // No need to continue processing if there are no selected projections.
                    return null;
                }

                // Get all the IDs of the selected projections
                var $selectedProjectionIds = $.map($selectedProjectionCheckboxes, function(p){
                    return $(p).attr("data-projectionid");
                });

                // Get the actual projection JSON objects for each selected checkbox.
                return $.grep(projectionData.projections, function(p){
                    return ($.inArray(p.id, $selectedProjectionIds) >= 0);
                });
            };

            // Determines all the selected species, and returns an Array of Strings.
            var getSelectedSpecies = function() {

                // Get all the species checkboxes that are selected.
                var $selectedSpeciesCheckboxes = $('.bccvl-species').filter(':checked');
                return $.map($selectedSpeciesCheckboxes, function(s){
                    return $(s).attr("value");
                });
            }

            var getSelectedYears = function() {

                // Get all the year checkboxes that are selected.
                var $selectedYearCheckboxes = $('.bccvl-year').filter(':checked');
                return $.map($selectedYearCheckboxes, function(y){
                    return $(y).attr("value");
                });
            }

            // Triggered whenever a projection is selected/deselected.
            var onProjectionChange = function(){

                // Remove all species & years & layers
                $speciesTableBody.empty();
                $yearsTableBody.empty();
                $layersTableBody.empty();

                $selectedProjections = getSelectedProjections();
                if ($selectedProjections == null) {
                    return;
                }

                // Determine all the species that the selected projections have in common.
                var $commonSpecies = $selectedProjections[0].species;
                $.each($selectedProjections, function(index, p){
                    $commonSpecies = $.intersect($commonSpecies, p.species);
                });

                // Create checkboxes for each common species.
                $.each($commonSpecies.sort(), function(index, s){
                    $speciesTableBody.append(renderSpecies(s));
                });

                // Wire up event listeners for all the newly created checkboxes.
                $('.bccvl-species').on("change", onSpeciesChange);
            };

            // Triggered whenever a species is selected/deselected.
            var onSpeciesChange = function() {

                // Remove all years & layers
                $yearsTableBody.empty();
                $layersTableBody.empty();

                $selectedProjections = getSelectedProjections();
                if ($selectedProjections == null) {
                    return;
                }

                $selectedSpecies = getSelectedSpecies();
                if ($selectedSpecies.length == 0) {
                    return;
                }

                // Filter all selected projections for the selected species, so we can get the intersection of the years.
                var years = new Array();
                $.each($selectedProjections, function(index, p){
                    var intersection = $.intersect(p.species, $selectedSpecies);
                    if (intersection.length == $selectedSpecies.length) {
                        $.each(p.result, function(index2, r){
                            if (r.files.length != 0 && $.inArray(r.year, years) < 0) {
                                years.push(r.year);
                            }
                        });
                    }
                });

                // Populate the years table.
                $.each(years.sort(), function(index, y){
                    $yearsTableBody.append(renderYear(y));
                });

                // Wire up event listeners for all the newly created checkboxes.
                $('.bccvl-year').on("change", onYearChange);
            }

            var onYearChange = function() {

                // Remove all layers
                $layersTableBody.empty();

                $selectedProjections = getSelectedProjections();
                if ($selectedProjections == null) {
                    return;
                }

                $selectedSpecies = getSelectedSpecies();
                if ($selectedSpecies.length == 0) {
                    return;
                }

                $selectedYears = getSelectedYears();
                if ($selectedYears.length == 0) {
                    return;
                }

                // Filter all selected projections for the selected species/year combinations to determine map layers.
                var layers = new Array();
                $.each($selectedProjections, function(index, p){
                    var intersection = $.intersect(p.species, $selectedSpecies);
                    if (intersection.length == $selectedSpecies.length) {
                        $.each(p.result, function(index2, r){
                            if (r.files.length != 0 && $.inArray(r.year, $selectedYears) >= 0) {
                                layers = layers.concat(r.files);
                            }
                        });
                    }
                });

                $.each(layers.sort(), function(index, l){
                    $layersTableBody.append(renderLayer(l));
                });
            };

            // TODO: To be replaced by a call to an AJAX endpoint
            var projectionData = getMockProjectionData();

            var $projectionTable = $('table.bccvl-projectiontable');
            var $projectionTableBody = $projectionTable.find('tbody');

            var $speciesTable = $('table.bccvl-speciestable');
            var $speciesTableBody = $speciesTable.find('tbody');

            var $yearsTable = $('table.bccvl-yearstable');
            var $yearsTableBody = $yearsTable.find('tbody');

            var $layersTable = $('table.bccvl-layerstable');
            var $layersTableBody = $layersTable.find('tbody');

            // Populate the projections table
            $.each(projectionData.projections, function(index, p){
                $projectionTableBody.append(renderProjection(p));
            });

            // Listener for when a Projection is selected/deselected.
            $('.bccvl-projection').on("change", onProjectionChange);
    });
});