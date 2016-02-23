
//
// main JS for the new sdm experiment page.
//
define(
    ['jquery', 'bccvl-preview-layout', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-search', 'bccvl-form-jquery-validate',
     'bccvl-form-popover', 'bbq', 'faceted_view.js',
     'bccvl-widgets', 'openlayers3', 'jquery-xmlrpc'],
    function($, preview_layout, vizcommon, vizmap, wiztabs, search, formvalidator,
             popover, bbq, faceted, bccvl, ol) {

        // ==============================================================
        $(function() {

            wiztabs.init();         // hook up the wizard buttons
            search.init();          // hook up the search fields

            $('.bccvllinks-datasets').attr('href', portal_url+'/datasets');

            // update validation rules
            // TODO: this should probably partly be some annotation on the input elements
            // FIXME: the element doesn't exist on page load.
            //var el = $('[name="form-widgets-species_absence_dataset"]');
            //el.rules('add', {'required': '#form-widgets-species_pseudo_absence_points-0:unchecked'});
            /*var el = $('#form-widgets-species_number_pseudo_absence_points');
            el.rules('add', 
                {'required': "#form-widgets-species_pseudo_absence_points-0:checked",
                             'min': 1}
            );*/

            // setup dataset select widgets
            new bccvl.SelectList("species_occurrence_dataset");
            new bccvl.SelectList("species_absence_dataset");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.

            var $algoCheckboxes = $('input[name="form.widgets.functions:list"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);
                // when the checkbox changes, update the config block's visibility
                $checkbox.change( function(evt) {
                    var $algoCheckbox = $(evt.target);
                    // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.
                    var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                    var $accordionToggle = $configBlock.find('.accordion-toggle');
                    var $accordionBody = $configBlock.find('.accordion-body');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
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

            // -- region selection ---------------------------------

            var xhr;
            var select_type, $select_type;
            var select_region, $select_region;

            $select_type = $('#select-region-type').selectize({
                onChange: function(value) {
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


            // -- absences + random --------------------------------
            // TODO: move  select-all / select-none into widget?
            $('#tab-enviro').on('click', '#form-widgets-environmental_datasets a.select-all', function(){
                $(this).parents('.selecteditem').find('ul li input[type="checkbox"]').prop('checked', 'checked');
            });

            $('#tab-enviro').on('click', '#form-widgets-environmental_datasets a.select-none', function(){
                // for some reason we have to remove the property as well to get the html to update in chrome, though the UI works fine
                $(this).parents('.selecteditem').find('ul li input[type="checkbox"]').each(function(){
                    $(this).prop('checked', false);
                });
            });

            // TODO: move  select-all / select-none into widget?
            $('#tab-config').on('click', 'a.select-all', function(){
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', 'checked').trigger('change');
            });

            $('#tab-config').on('click', 'a.select-none', function(){
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', false).trigger('change');;  
            });

            // -- set up region constraints
            $('#form-widgets-modelling_region').attr('readonly', true);

            $.when(vizcommon.renderBase($('.constraints-map').attr('id'))).then(function(map, visLayers) {
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
                var mapid = $('.constraints-map').attr('id');

                // map.updateSize()
                if ($('.constraints-map').not(':visible')) {
                    $('a[href="#tab-geo"]').one('shown', function(evt) {
                        map.updateSize();
                        world = [-20037508.342789244, -19971868.880408563, 20037508.342789244, 19971868.88040853];
                        // visLayers-> group
                        // bboxLayer
                        // constraintsLayer
                        var bext = bboxLayer.getSource().getExtent();
                        map.getView().fit(world, map.getSize(), {'constrainResolution': false});
                    });
                }
                
                // set up constraint tools
                vizcommon.constraintTools(map, constraintsLayer, 'form-widgets-modelling_region');

                // bind widgets to the constraint map
                $('.bccvl-new-sdm').on('widgetChanged', function(e){
                        
                    // recreate legend
                    $('#'+map.getTarget()).find('.olLegend').remove();
                    vizcommon.createLegendBox(map.getTarget(), 'Selected Datasets');

                    // clear any existing layers.
                    visLayers.getLayers().clear(); // clear species layers
                    bboxLayer.getSource().clear(); // clear bboxes as well

                    var geometries = [];
                    // FIXME: the find is too generic (in case we add bboxes everywhere)
                    $('body').find('input[data-bbox]').each(function(){
                        var type = $(this).data('type');
                        if (type == 'DataGenreSpeciesOccurrence' || type == 'DataGenreSpeciesAbsence') {
                            vizcommon.addLayersForDataset($(this).val(), mapid, null, visLayers).then(function(newLayers) {
                                // FIXME: assumes only one layer because of species data
                                var newLayer = newLayers[0];
                                vizcommon.addLayerLegend(
                                    map.getTarget(),
                                    newLayer.get('title'),
                                    newLayer.get('bccvl').layer.style.color, null, null);
                            });
                        } else {
                            var geom = $(this).data('bbox');
                            geom = new ol.geom.Polygon([[
                                [geom.left, geom.bottom],
                                [geom.right, geom.bottom],
                                [geom.right, geom.top],
                                [geom.left, geom.top],
                                [geom.left, geom.bottom]
                            ]]);
                            //geom.type = type;
                            geometries.push(geom);
                        }
                    });
                    // draw collected geometries
                    vizcommon.drawBBoxes(map, geometries, bboxLayer);
                        
                });

            });

        });
        // ==============================================================
    }
);
