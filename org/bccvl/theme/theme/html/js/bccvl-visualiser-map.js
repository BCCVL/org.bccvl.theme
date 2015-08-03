
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // Bring in generic visualiser error handling of timeouts
        vizcommon.commonAjaxSetup();

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        // new list layout events
        $('body').on('click', '.bccvl-list-occurrence-viz, .bccvl-list-absence-viz', function(event){
            event.preventDefault();
            renderMap($(this).data('uuid'), $(this).data('viz-id'), 'map-'+$(this).data('uuid')+'', 'occurence');
        });

        $('body').on('click', 'a.bccvl-list-auto-viz', function(event){
            event.preventDefault();
            renderMap($(this).data('uuid'),$(this).data('viz-id'), 'map-'+$(this).data('uuid')+'', 'auto', $(this).data('viz-layer'));
        });

        // older events (still in use on experiment pages and a few others)
        $('body').on('click', '.bccvl-occurrence-viz, .bccvl-absence-viz', function(event){
            event.preventDefault();
            renderMap($(this).data('uuid'), $(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'occurence');
        });

        $('body').on('click', 'a.bccvl-auto-viz', function(event){
            event.preventDefault();
            var type = $(this).data('mimetype');

            if (type == 'image/geotiff'){
                // hack in old style visualiser here
                var iframe = $(this).closest('.tab-pane, body').find('iframe.bccvl-viz');
                if (iframe.length != 0) {
                    var vizid = $(this).data('viz-id');
                    require(['js/bccvl-visualiser'], function(bccvl_visualiser){
                        bccvl_visualiser.visualise(vizid, iframe);
                    });
                } else {
                    renderMap($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));
                }
            } else if (type == 'image/png'){
                renderPng($(this).data('uuid'), $(this).data('file-url'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/csv'){
                renderCSV($(this).data('uuid'), $(this).data('file-url'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/x-r-transcript' || type ==  'application/json' || type == 'text/plain') {
                renderCode($(this).data('uuid'), $(this).data('file-url'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/pdf') {
                renderPDF($(this).data('uuid'), $(this).data('file-url'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/zip') {
                renderMap($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));                
            }
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
                layer_vocab[value.token] = value.title;
            });
        });

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function renderMap(uuid, url, id, type, visibleLayer) {
            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }

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
                    
                    // check for layers metadata, if none exists then the request is returning a data like a csv file
                    // TODO: alternative check data.mimetype == 'text/csv' or data.genre
                    //       or use type passed in as parameter
                    if ($.isEmptyObject(data.layers)) {
                        // species data  (not a raster)
                        // TODO: use data.title (needs to be populated)
                        var layerTitle = data.description || 'Data Overlay';
                        // there is no legend for csv data
                        var newLayer = vizcommon.createLayer(uuid, data, data, layerTitle, 'wms-occurrence', true);
                        // add layer to layers group
                        visLayers.getLayers().push(newLayer);
                    } else {
                        // raster data
                        // TODO: data.layer could be standard array, as layerid is in layer object as well
                        $.each( data.layers, function(layerid, layer){
                            // get title from vocab or use layer identifier
                            // TODO: undefined layers like probability maps don't use a layer identifier, but use a file name as identifier
                            //       maybe generate proper layer id as well?
                            layerTitle = layer_vocab[layer.layer] || layer.layer || layer.filename;
                            // DETERMINE VISIBILITY, IF LAYER IS NOMINATED - RENDER IT, IF NOT - DEFAULT TO FIRST
                            // if visibleLayer is undefined set first layer visible
                            if (typeof visibleLayer == 'undefined') {
                                visibleLayer = layer.filename;
                            }
                            var isVisible = layer.filename == visibleLayer;
                            // object to hold legend and color ranges
                            var styleObj;
                            if (layer.datatype == 'continuous'){
                                // probability uses different styleObj (0..1 without midpoint) and adjusted max for 0..1 ; 0..1000 range
                                var max = vizcommon.roundUpToNearestMagnitude(layer.max);
                                styleObj = {
                                    minVal: 0, // TODO: mahal has negative min value?
                                    maxVal: max,
                                    steps: 20,
                                    startpoint: null,
                                    midpoint: null,
                                    endpoint: null
                                };
                            } else {
                                // standard raster
                                styleObj = {
                                    minVal: layer.min,
                                    maxVal: layer.max,
                                    steps: 20,
                                    startpoint: {r:255,g:255,b:255},
                                    midpoint: {r:231,g:76,b:60},
                                    endpoint: {r:192,g:57,b:43}
                                };
                            }
                            // create legend for this layer
                            // TODO: units
                            var legend = vizcommon.createLegend(
                                { title: layerTitle,
                                  id: layer.layer || layer.filename,
                                  type: layer.datatype
                                },
                                id, styleObj.minVal, styleObj.maxVal, 20);
                            
                            // create layer
                            var newLayer = vizcommon.createLayer(uuid, data, layer, layerTitle, 'wms', isVisible, styleObj, legend);
                            // add new layer to layer group
                            visLayers.getLayers().push(newLayer);
                            // if layer is visible we have to show legend as well
                            if (isVisible) {
                                $('#'+id+' .ol-viewport').append(legend);
                            }
                        });
                    }

                    layerSwitcher.renderPanel();
                    layerSwitcher.showPanel();

                    visLayers.getLayers().forEach(function(lyr, idx, arr) {
                        lyr.on('change:visible', function(e){
                            if (lyr.getVisible()){
                                var bccvl = lyr.get('bccvl');
                                // remove existing legend
                                $('.olLegend').remove();
                                // add new legend to dom tree
                                $('#'+id+' .ol-viewport').append(bccvl.legend);
                            }
                        });
                    });

                    // hook up exportAsImage
                    $('#'+id+' .ol-viewport').append('<a class="export-map" download="map.png" href=""><i class="fa fa-save"></i> Image</a>');
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

            container.addClass('active');
        }

        // RENDER PNG IMAGES
        function renderPng(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('olMap')) {
                window.map.destroy();
                container.removeClass('olMap');
            }
            container.height('auto').html('<img src="'+url+'" alt="" />').addClass('active');
        }

        // RENDER CODE
        function renderCode(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('olMap')) {
                window.map.destroy();
                container.removeClass('olMap');
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
            if (container.hasClass('olMap')) {
                window.map.destroy();
                container.removeClass('olMap');
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
            if (container.hasClass('olMap')) {
                window.map.destroy();
                container.removeClass('olMap');
            }
            container.html('<object type="application/pdf" data="' + url + '" width="100%" height="810px"></object>');
        }                

    }
);
