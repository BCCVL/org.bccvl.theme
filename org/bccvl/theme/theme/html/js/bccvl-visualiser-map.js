
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        // new list layout events
        $('body').on('click', '.bccvl-list-occurrence-viz, .bccvl-list-absence-viz', function(event){
            event.preventDefault();
            render.mapRender($(this).data('uuid'), $(this).data('href'), 'map-'+$(this).data('uuid')+'', 'occurence');
        });

        $('body').on('click', 'a.bccvl-list-auto-viz', function(event){
            event.preventDefault();
            render.mapRender($(this).data('uuid'),$(this).data('href'), 'map-'+$(this).data('uuid')+'', 'auto', $(this).data('viz-layer'));
        });

        // older events (still in use on experiment pages and a few others)
        $('body').on('click', '.bccvl-occurrence-viz, .bccvl-absence-viz', function(event){
            event.preventDefault();
            render.mapRender($(this).data('uuid'), $(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'), 'occurence');
        });

        $('body').on('click', 'a.bccvl-auto-viz', function(event){
            event.preventDefault();
            var type = $(this).data('mimetype');

            if (type == 'image/geotiff'){
                // hack in old style visualiser here
                var iframe = $(this).closest('.tab-pane, body').find('iframe.bccvl-viz');
                if (iframe.length != 0) {
                    var vizid = $(this).data('href');
                    require(['js/bccvl-visualiser'], function(bccvl_visualiser){
                        bccvl_visualiser.visualise(vizid, iframe);
                    });
                } else {
                    render.mapRender($(this).data('uuid'),$(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));
                }
            } else if (type == 'image/png'){
                renderPng($(this).data('uuid'), $(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/csv'){
                renderCSV($(this).data('uuid'), $(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/x-r-transcript' || type ==  'application/json' || type == 'text/plain' || type == 'text/x-r' || type == 'application/x-perl') {
                renderCode($(this).data('uuid'), $(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/pdf') {
                renderPDF($(this).data('uuid'), $(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/zip') {
                render.mapRender($(this).data('uuid'),$(this).data('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));                
            }
        });

        // setup popover handling for bccvl-preview-pane
        $('.bccvl-preview-pane').popover({
            'selector': '[data-toggle="popover"]',
            'trigger': 'hover'
        }).on('shown', function(e) { // prevent events from bubbling up to modal
            e.stopPropagation();
        }).on('hidden', function(e) {
            e.stopPropagation();
        });
        

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        var map;
        // Australia Bounds
        var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
        var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
        var australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);
                        
        var layer_vocab = {};
        // FIXME: is there a  race condition possible here?
        //        e.g. layer_vocab is required before it is populated?
        $.getJSON(portal_url + "/dm/getVocabulary", {name: 'layer_source'}, function(data, status, xhr) {
            $.each(data, function(index, value) {
                layer_vocab[value.token] = value;
            });
        });

        // Render a base map if theres a map of it's class
        $('body').find('.pre-render-map').each(function(){
            if ($(this).hasClass('constraints-map')){
                $.when( vizcommon.renderBase($(this).attr('id')) ).then(function(map){
                    // set up constraint tools
                    vizcommon.constraintTools(map);

                    // bind widgets to the constraint map
                    $('.bccvl-new-sdm').on('widgetChanged', function(e){
                        
                        // recreate legend
                        $('#'+map.getTarget()).find('.olLegend').remove();
                        vizcommon.createLegendBox(map.getTarget(), 'Selected Datasets');

                        // clear any existing layers.
                        map.getLayers().forEach(function(lyr) {
                            if (lyr.get('type') == 'wms-occurrence'){
                                map.removeLayer(lyr);
                            }
                        });

                        var geometries = [];

                        $('body').find('input[data-bbox]').each(function(){
                            var type = $(this).data('type');
                            if (type == 'DataGenreSpeciesOccurrence' || type == 'DataGenreSpeciesAbsence') {
                                vizcommon.layerForExtent(dmurl, map, $(this).val(), type);
                            } else {
                                var geom = $(this).data('bbox');
                                geom.type = type;
                                geometries.push(geom);
                        
                                vizcommon.drawBBoxes(map, geometries);
                            }
                        });
                        
                    });

                });
            } else {
                vizcommon.renderBase($(this).attr('id'));
            } 
        });

        var render = {
            // RENDER DATA LAYERS
            // -------------------------------------------------------------------------------------------
            mapRender: function(uuid, url, id, type, visibleLayer) {
                // CREATE BASE MAP
                // -------------------------------------------------------------------------------------------

                // NEED TO DESTROY ANY EXISTING MAP
                var container = $('#'+id);
                if (container.hasClass('active')) {
                    container.empty();
                    map = null;
                }

                // destroy any floating progress bars (should be destroyed above, this is a fallback)
                $('#progress-'+id).remove();

                // layer group 
                var visLayers = new ol.layer.Group({
                    title: 'Layers',
                    layers: []
                });

                // map with base layers
                map = new ol.Map({
                    target: id,
                    layers: [
                        new ol.layer.Group({
                            'title': 'Base maps',
                            layers: [
                                new ol.layer.Tile({
                                    title: 'OSM',
                                    type: 'base',
                                    preload: 10,
                                    visible: true,
                                    source: new ol.source.OSM()
                                }),
                                new ol.layer.Tile({
                                    title: 'Satellite',
                                    type: 'base',
                                    visible: false,
                                    source: new ol.source.MapQuest({layer: 'sat'})
                                })
                            ]
                        }),
                        visLayers
                    ],
                    view: new ol.View({
                      center: ol.proj.transform([133, -27], 'EPSG:4326', 'EPSG:3857'),
                      zoom: 4
                    })
                });

                // zoom to Australia
                map.getView().fit(australia_bounds, map.getSize());

                // add layerswitcher
                var layerSwitcher = new ol.control.LayerSwitcher({
                    toggleOpen: true,
                    singleVisibleOverlay: true
                });

                map.addControl(layerSwitcher);

                // add fullscreen toggle control
                var fullScreenToggle = new ol.control.FullScreen();
                map.addControl(fullScreenToggle);

                
                // remove crappy unicode icon so fontawesome can get in
                $('#'+id+' button.ol-full-screen-false').html('');

                // fetch layer metadata and build up map layers
                $.xmlrpc({
                    url: dmurl,
                    params: {'datasetid': uuid},
                    success: function(data, status, jqXHR) {

                        // xmlrpc returns an array of results
                        data = data[0];
                        // define local variables
                        var layerdef;
                        
                        // check for layers metadata, if none exists then the request is returning a data like a csv file
                        // TODO: alternative check data.mimetype == 'text/csv' or data.genre
                        //       or use type passed in as parameter
                        if ($.isEmptyObject(data.layers)) {
                            // species data  (not a raster)
                            // TODO: use data.title (needs to be populated)
                            layerdef = {
                                'title': data.description || 'Data Overlay'
                            }

                            if (data.genre == "DataGenreSpeciesOccurrence") {
                                layerdef.type = 'occurrence';
                                layerdef.style = {
                                    color: '#e74c3c'
                                }
                            } else if (data.genre == "DataGenreSpeciesAbsence") {
                                layerdef.type = 'absence';
                                layerdef.style = {
                                    color: '#3498db'
                                }
                            } 

                            // there is no legend for csv data
                            var newLayer = vizcommon.createLayer(id, layerdef, data, 'wms-occurrence');
                            // add layer to layers group
                            visLayers.getLayers().push(newLayer);
                        } else {
                            // raster data
                            // TODO: data.layer could be standard array, as layerid is in layer object as well
                            $.each( data.layers, function(layerid, layer){
                                // get layer definition from vocab
                                layerdef = layer_vocab[layer.layer];
                                if (typeof layerdef === 'undefined') {
                                    // We don't have a layerdef so let's create a default fallback
                                    // TODO: this may happen in case of experiment outputs (i.e. probability maps) ... they don't have a layer identifier, but a file name
                                    // FIXME: how do I know if it is a probability map or just some undefined layer?
                                    layerdef = {
                                        'token': layer.layer,
                                        'title': layer.layer || layer.filename,
                                        'unitfull': '',
                                        'unit': '',
                                        'type': '',  // unused
                                        'legend': 'default',
                                        'tooltip': '',
                                        'filename': layer.filename
                                    }
                                    if (data.genre == 'DataGenreCP' || data.genre == 'DataGenreFP') {
                                        layerdef.legend = 'suitability';
                                        layerdef.unit = ' ';
                                        layerdef.unitfull = 'Environmental suitability';
                                        layerdef.tooltip = 'This value describes the environmental suitability of a species presence in a given location.';
                                    }
                                } else {
                                    // make a copy of the original object
                                    layerdef = $.extend({}, layerdef)
                                    // for zip files we need the filename associated with the layer
                                    if (layer.filename) {
                                        layerdef.filename = layer.filename;
                                    }
                                }
                                // copy datatype into layer def object
                                layerdef.datatype = layer.datatype;
                                // add min / max values
                                // FIXME: this should go away but some datasets return strings instead of numbers
                                layerdef.min = Number(layer.min);
                                layerdef.max = Number(layer.max);
                                // DETERMINE VISIBILITY, IF LAYER IS NOMINATED - RENDER IT, IF NOT - DEFAULT TO FIRST
                                // if visibleLayer is undefined set first layer visible
                                if (typeof visibleLayer == 'undefined') {
                                    visibleLayer = layer.filename;
                                }
                                layerdef.isVisible = layer.filename == visibleLayer;

                                $.when( vizcommon.createStyleObj(layerdef, uuid) ).then(function(styleObj, layerdef){
                                    // object to hold legend and color ranges
                                    layerdef.style = styleObj;

                                    // create legend for this layer
                                    var legend = vizcommon.createLegend(layerdef);
                                    
                                    // create layer
                                    var newLayer = vizcommon.createLayer(id, layerdef, data, 'wms', legend);
                                    // REMOVE: (uuid, data, layer, layerdef.title, 'wms', layerdef.isVisible, styleObj, legend, layerdef.legend);
                                    // add new layer to layer group

                                    newLayer.on('change:visible', function(e){
                                        if (newLayer.getVisible()){
                                            var bccvl = newLayer.get('bccvl');
                                            // remove existing legend
                                            $('.olLegend').remove();
                                            // add new legend to dom tree
                                            $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append(bccvl.legend);
                                        }
                                    });

                                    visLayers.getLayers().push(newLayer);

                                    // if layer is visible we have to show legend as well
                                    if (layerdef.isVisible) {
                                        $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append(legend);
                                    }

                                    layerSwitcher.renderPanel();

                                });
                                
                            });
                        }

                        layerSwitcher.showPanel();

                        // hook up exportAsImage
                        $('#'+id+' .ol-viewport  .ol-overlaycontainer-stopevent').append('<a class="export-map ol-control" download="map.png" href=""><i class="fa fa-save"></i> Image</a>');
                        $('#'+id+' a.export-map').click(
                            { map: map,
                              mapTitle: data.title
                            }, vizcommon.exportAsImage);

                        // add click control for point return
                        map.on('singleclick', function(evt){
                            vizcommon.getPointInfo(evt);
                        });

                        map.on('pointermove', function(evt) {
                            vizcommon.hoverHandler(evt);
                        });

                    }});
                // set to active
                container.addClass('active');
                // add progress bar container
                container.find('.ol-viewport .ol-overlaycontainer-stopevent').append('<div id="progress-'+id+'" class="map-progress-bar"></div>');
            }
        }

        // RENDER PNG IMAGES
        function renderPng(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }
            container.height('auto').html('<img src="'+url+'" alt="" />').addClass('active');
        }

        // RENDER CODE
        function renderCode(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }
            $.ajax({
                url: url, 
                dataType: 'text',
                success: function( data ) {
                    container.height('auto').html('<pre><code class="language-javascript">'+data+'</code></pre>').addClass('active');
                    Prism.highlightAll();
                },
                error: function() {
                    container.html('<pre>Problem loading data. Please try again later.</pre>');
                }
            });
        }

        // RENDER CSV
        function renderCSV(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }
            $.ajax({
                url: url, 
                dataType: 'text',
                success: function( data ) {
                    container.height('auto').html('').CSVToTable(url,
                        {
                            tableClass: 'table table-striped'
                        });
                },
                error: function() {
                    container.html('<pre>Problem loading data. Please try again later.</pre>').addClass('active');
                }
            });
        }

        function renderPDF(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }
            container.html('<object type="application/pdf" data="' + url + '" width="100%" height="810px"></object>');
        }         

        return render;       

    }
);
