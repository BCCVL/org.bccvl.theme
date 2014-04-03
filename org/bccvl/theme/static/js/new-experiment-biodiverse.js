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
                                    "files": [  ]
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
                                    "files": [ "RCP3PD_cccma-cgcm31_2015.tif" ]
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
                                    "files": [ "RCP3PD_cccma-cgcm31_2015.tif" ]
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


            // TODO: To be replaced by a call to an AJAX endpoint
            var projectionData = getMockProjectionData();

            var $projectionTable = $('table.bccvl-projectiontable');
            var $projectionTableBody = $projectionTable.find('tbody');

            var $speciesTable = $('table.bccvl-speciestable');
            var $speciesTableBody = $speciesTable.find('tbody');

            var renderProjection = function(projectionJSON) {
                var html = '';
                html += '<tr">';
                html +=  '<td>';
                html +=   '<input class="bccvl-projection" type="checkbox" data-projectionid="' + projectionJSON.id + '"></input>';
                html +=  '</td>';
                html +=  '<td>';
                html +=   projectionJSON.name;
                html +=  '</td>';
                html += '</tr>';
                return html;
            }

            var renderSpecies = function(speciesName) {
                var html = '';
                html += '<tr">';
                html +=  '<td>';
                html +=   '<input class="bccvl-speces" type="checkbox"></input>';
                html +=  '</td>';
                html +=  '<td>';
                html +=   speciesName;
                html +=  '</td>';
                html += '</tr>';
                return html;
            }

            $.each(projectionData.projections, function(index, p){
                $projectionTableBody.append(renderProjection(p));
            });

            // Listener for when a Projection is selected/deselected.
            $('.bccvl-projection').change(function() {

                // Remove all species & years
                $speciesTableBody.empty();

                // Get all the projection checkboxes that are selected.
                var $selectedProjectionCheckboxes = $('.bccvl-projection').filter(':checked');
                if ($selectedProjectionCheckboxes.length == 0) {
                    // No need to continue processing if there are no selected projections.
                    return;
                }

                // Get all the IDs of the selected projections
                var $selectedProjectionIds = $.map($selectedProjectionCheckboxes, function(p){
                    return $(p).attr("data-projectionid");
                });

                // Get the actual projection JSON objects for each selected checkbox.
                var $selectedProjections = $.grep(projectionData.projections, function(p){
                    return ($.inArray(p.id, $selectedProjectionIds) >= 0);
                });

                // Determine all the species that the selected projections have in common.
                var $commonSpecies = $selectedProjections[0].species;
                $.each($selectedProjections, function(index, p){
                    $commonSpecies = $.intersect($commonSpecies, p.species);
                });

                // Create checkboxes for each common species.
                $.each($commonSpecies.sort(), function(index, s){
                    $speciesTableBody.append(renderSpecies(s));
                });


            });
    });     
});
