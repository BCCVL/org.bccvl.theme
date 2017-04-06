

define(
    ['jquery', 'openlayers3', 'bccvl-visualiser-common', 'bccvl-api', 'selectize', 'selectize-remove-single'],
    function( $, ol, vizcommon, bccvlapi ) {

        function init_region_selector() {

            var select_type, $select_type;
            var select_region, $select_region;

            $select_type = $('#select-region-type').selectize({
                onChange: function(value) {
                    var xhr;
                    if (!value.length) return;
                    select_region.disable();
                    select_region.clearOptions();
                    select_region.load(function(callback) {
                        xhr && xhr.abort();
                        xhr = $.ajax({
                            url: '/_spatial/ws/field/' + value,
                            success: function(data) {
                                select_region.enable();
                                
                                var results = [];
                                
                                $.each(data.objects, function (key, feature) {
                                    
                                    var match = {
                                        'name': feature.name,
                                        'pid': feature.pid
                                    }
                                    results.push(match);
                                });
                                callback(results);
                            },
                            error: function() {
                                callback();
                            }
                        })
                    });
                }
            });

            $select_region = $('#select-region').selectize({
                valueField: 'pid',
                labelField: 'name',
                searchField: ['name'],
                onChange: function(value){
                    $.ajax({
                        url: '/_spatial/ws/shape/geojson/' + value,
                        success: function(result) {
                            // have to clean up ALA's geojson format
                            var geojson = {
                                'type': 'Feature',
                                'geometry': result
                            }
                            $('#selected-geojson').data('geojson', JSON.stringify(geojson));
                        },
                        error: function(error) {
                            console.log(error);
                        }
                    })
                }
            });

            select_region  = $select_region[0].selectize;
            select_type = $select_type[0].selectize;

            select_region.disable();

        }


        // msdm , false
        function init_algorithm_selector(selector, multi) {
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.
            var $algoCheckboxes = $(selector);
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);

                // when the checkbox changes, update the config block's visibility
                $checkbox.change(function(evt) {
                    var $algoCheckbox = $(evt.target);
                    // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.

                    if (!multi) {
                        // for single select we have to deactivate all other config blocks
                        var $visibleBlocks = $('#algoConfig .accordion-group:visible');
                        $.each($visibleBlocks, function(index, configBlock) {
                            var $configBlock = $(configBlock);
                            var $accordionBody = $configBlock.find('.accordion-body');
                            var $accordionToggle = $configBlock.find('.accordion-toggle');
                            // make sure that the accordion closes before hiding it
                            if ($accordionBody.hasClass('in')) {
                                $accordionBody.collapse('hide');
                                $accordionToggle.addClass('collapsed');
                                $accordionBody.removeClass('in');
                            }
                            // This is to avoid validation thinking that there are validation errors on algo conifg items that have been
                            // deselected - so we put the default value back into the text field when deselected.
                            $.each($configBlock.find('input[type="number"], input[type="text"]'), function(i, c) {
                                $(c).val($(c).attr('data-default'));
                            });
                            
                            $configBlock.hide(250);
                        });
                    }

                    // make selected config block visible
                    var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                    var $accordionBody = $configBlock.find('.accordion-body');
                    var $accordionToggle = $configBlock.find('.accordion-toggle');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
                            // By default, pa strategy is random when no pseudo absence data. Otherwise is none i.e. do not generate pseudo absence points.
                            // By default, pa strategy is random when no pseudo absence data. Otherwise is none i.e. do not generate pseudo absence points.
                            //$('select[name="form.widgets.' + $algoCheckbox.attr('value') + '.pa_strategy:list"]').val($('#have_absence').checked ? 'none' : 'sre');
                        } else {
                            // make sure that the accordion closes before hiding it
                            if ($accordionBody.hasClass('in')) {
                                $accordionBody.collapse('hide');
                                $accordionToggle.addClass('collapsed');
                                $accordionBody.removeClass('in');
                            }
                            // This is to avoid validation thinking that there are validation errors on algo conifg items that have been
                            // deselected - so we put the default value back into the text field when deselected.
                            $.each($configBlock.find('input[type="number"], input[type="text"]'), function(i, c) {
                                $(c).val($(c).attr('data-default'));
                            });

                            $configBlock.hide(250);
                        }
                    } else {
                        if (console && console.log) {
                            console.log("no config block located for algorithm/function '" + $algoCheckbox.attr('value') + "'");
                        }
                    }
                });
                // finally, invoke the change handler to get the inital visibility sorted out.
                $checkbox.change();
            });

            // hookup all/none buttons/links
            $algoCheckboxes.parents('table').on('click', 'a.select-all', function() {
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', 'checked').trigger('change');
            })

            $algoCheckboxes.parents('table').on('click', 'a.select-none', function() {
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', false).trigger('change'); 
            })
            
        }

        function init_constraints_map(selector, $tab, fieldname) {
            
            var mapid = $(selector).attr('id');
            var base_map = vizcommon.renderBase(mapid)
            var map = base_map.map
            var visLayers = base_map.visLayers
            
            // add layers for bboxes and drawing area
            var features = new ol.Collection(); // drawn feature
            var constraintsLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    wrapX: false,
                    features: features
                }),
                id: 'constraints_layer',
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 160, 228, 0.1)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 160, 228, 0.9)',
                        width: 2
                    })
                })
            });
            var bboxLayer = new ol.layer.Vector({
                source: new ol.source.Vector({wrapX: false}),
                id: 'dataset_bounds'
            });
            var vectors = new ol.layer.Group({
                // extent: ... set to Mercator bounds [-180, -85, +180, +85]
                layers: [
                    bboxLayer,
                    constraintsLayer
                ]
            });
            map.addLayer(vectors);

            // map.updateSize()
            if ($('.constraints-map').not(':visible')) {
                $tab.one('shown', function(evt) {
                    map.updateSize();
                    var world = [-20037508.342789244, -19971868.880408563, 20037508.342789244, 19971868.88040853];
                    // visLayers-> group
                    // bboxLayer
                    // constraintsLayer
                    var bext = bboxLayer.getSource().getExtent();
                    map.getView().fit(world, map.getSize(), {'constrainResolution': false});
                });
            }

            // set up constraint tools
            vizcommon.constraintTools(map, constraintsLayer, fieldname);

            return {
                map: map,
                mapid: mapid,
                visLayers: visLayers,
                bboxLayer: bboxLayer,
                constraintsLayer: constraintsLayer,
            }

        }

        function update_constraints_map(cmap, $els) {
            // cmap ... whatever init_constraints_map returned
            // els ... elements with dataset infos

            // unpack cmap
            var map = cmap.map
            var mapid = cmap.mapid
            var visLayers = cmap.visLayers
            var bboxLayer = cmap.bboxLayer
            var constraintsLayer = cmap.constraintsLayer

            // recreate legend
            $('#'+map.getTarget()).find('.olLegend').remove();
            vizcommon.createLegendBox(map.getTarget(), 'Selected Datasets');
                
            // clear any existing layers.
            visLayers.getLayers().clear(); // clear species layers
            bboxLayer.getSource().clear(); // clear bboxes as well
            vizcommon.setOccurrencePolygon(null); // reset the occurrence convex-hull polygon
            constraintsLayer.getSource().clear(); // clear the constraint
                
            var geometries = [];

            $els.each(function() {
                var type = $(this).data('genre');
                if (type == 'DataGenreSpeciesOccurrence' ||
                    type == 'DataGenreSpeciesAbsence' ||
                    type == 'DataGenreTraits' ||
                    type == 'DataGenreSpeciesCollection') {
                        
                    var data_url = $(this).data('url');
                    vizcommon.addLayersForDataset($(this).val(), data_url, mapid, null, visLayers).then(function(newLayers) {
                        // FIXME: assumes only one layer because of species data
                        var newLayer = newLayers[0];
                        vizcommon.addLayerLegend(
                            map.getTarget(),
                            newLayer.get('title'),
                            newLayer.get('bccvl').layer.style.color, null, null);

                        // Draw convex-hull polygon for occurrence dataset in map
                        if (type == 'DataGenreSpeciesOccurrence' || type == 'DataGenreSpeciesCollection') {
                            // TODO: can this bit run in a separate even thandler?
                            var mimetype = newLayer.get('bccvl').data.mimetype;   // dataset mimetype
                            var filename = newLayer.get('bccvl').layer.filename;  // layer filename for zip file
                            vizcommon.drawConvexhullPolygon(data_url, filename, mimetype, map, constraintsLayer);
                        }
                    })
                } else {
                    var bbox = $(this).attr('data-bbox');
                    if (typeof bbox !== typeof undefined && bbox !== false) {
                        var geom = $(this).data('bbox');
                        geom = new ol.geom.Polygon([[
                            [geom.left, geom.bottom],
                            [geom.right, geom.bottom],
                            [geom.right, geom.top],
                            [geom.left, geom.top],
                            [geom.left, geom.bottom]
                        ]]);
                        geom.type = type;
                        geometries.push(geom);
                    } else {
                        // Get the region constraint from the SDM experiment as the constraint for
                        // Climate Change Experiment. Need to transform constraint geometry to
                        // EPSG:4326 as used in vizcommon.renderPolygonConstraints
                        var sdmexp_id = $(this).attr('value');
                        bccvlapi.em.metadata(sdmexp_id).then(function(data, status, jqXHR){
                            var region_constraint = data['results'][0]['params']['modelling_region'];
                            $('#form-widgets-projection_region').val(region_constraint);
                            
                            if (region_constraint) {
                                var geojsonParser = new ol.format.GeoJSON();
                                var srcProjection = geojsonParser.readProjection(region_constraint);
                                var feature = geojsonParser.readFeature(region_constraint);
                                vizcommon.renderPolygonConstraints(
                                    map, 
                                    feature.getGeometry().transform(srcProjection, 'EPSG:4326'), 
                                    constraintsLayer, 
                                    'EPSG:4326')
                            }
                        });
                    }
                }
            });
            // draw collected geometries
            vizcommon.drawBBoxes(map, geometries, bboxLayer);
        }
        
        function init_pa_controls () {
            $('#pa_controls').on('change', 'input, select', function(e){
                var fieldtype = $(this).attr('id');
                var val = $(this).val();
                
                $('[id*="'+fieldtype+'"]').each(function(){
                    $(this).val(val);   
                });
            });
        }
            
        return {
            init_region_selector: init_region_selector,
            init_algorithm_selector: init_algorithm_selector,
            init_constraints_map: init_constraints_map,
            update_constraints_map: update_constraints_map,
            init_pa_controls: init_pa_controls
        }
    }
)

       
