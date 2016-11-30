
//
// main JS for the new sdm experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-form-popover', 'bbq', 'faceted_view.js',
     'bccvl-widgets', 'openlayers3', 'new-experiment-common',
     'livechat'],
    function($, vizcommon, vizmap, wiztabs, formvalidator,
             popover, bbq, faceted, bccvl, ol, expcommon) {

        // ==============================================================
        $(function() {

            wiztabs.init();         // hook up the wizard buttons

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
                    var $accordionBody = $configBlock.find('.accordion-body');
                    var $accordionToggle = $configBlock.find('.accordion-toggle');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
                            // By default, pa strategy is random when no pseudo absence data. Otherwise is none i.e. do not generate pseudo absence points.
                            $('select[name="form.widgets.' + $algoCheckbox.attr('value') + '.pa_strategy:list"]').val($('#have_absence').checked ? 'none' : 'random');
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
            expcommon.init_region_selector()


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

            // -- set up absence radio buttons
            $('#have_absence').click(function(){
                $('.bccvl-noabsence-dataset').slideUp(100);
                $('.bccvl-absencestable').slideDown(100);
                update_pa_strategy('none');
            });
            $('#no_absence').click(function(){
                $('.bccvl-absencestable').slideUp(100);
                $('.bccvl-noabsence-dataset').slideDown(100);
                update_pa_strategy('random');
            });

            var base_map = vizcommon.renderBase($('.constraints-map').attr('id'))
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
                vizcommon.setOccurrencePolygon(null); // reset the occurrence convex-hull polygon
                constraintsLayer.getSource().clear(); // clear the constraint
                
                var geometries = [];
                // FIXME: the find is too generic (in case we add bboxes everywhere)
                $('body').find('input[data-bbox]').each(function(){
                    var type = $(this).data('genre');
                    if (type == 'DataGenreSpeciesOccurrence' || type == 'DataGenreSpeciesAbsence' || type == 'DataGenreSpeciesCollection') {
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

        // ==============================================================
        function update_pa_strategy(strategyname) {
            var $algoCheckboxes = $('input[name="form.widgets.functions:list"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);
                if ($checkbox.prop('checked')) {
                    // Set new option
                    $('select[name="form.widgets.' + $checkbox.attr('value') + '.pa_strategy:list"]').val(strategyname);
                }
            });            
        }

    }
);
