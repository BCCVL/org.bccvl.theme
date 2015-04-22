
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable'],
            function( $, preview, ol, layerswitcher, vizcommon  ) {

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
            }
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        var styleObj = {"minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:231,g:76,b:60},"endpoint":{r:192,g:57,b:43}};

        var layer_vocab = {};
                $.getJSON(portal_url + "/dm/getVocabulary", {name: 'layer_source'}, function(data, status, xhr) {
                    $.each(data, function(index, value) {
                        layer_vocab[value.token] = value.title;
                    });
                });
        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function renderMap(uuid, url, id, type, visibleLayer){

            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            if (container.hasClass('olMap'))
                window.map.destroy();

            // destroy any html from images or text files
            container.html('').height(container.parents('.tab-pane').height());

            window.map;
            //var mercator, geographic;
            //var loading_panel;

            // DecLat, DecLng
            //geographic = new OpenLayers.Projection("EPSG:4326");
            //var geographic = new ol.proj.Projection({ code: 'EPSG:4326' });
            //ol.proj.addProjection(geographic);

            // Spherical Meters
            // The official name for the 900913 (google) projection
            //mercator = new OpenLayers.Projection("EPSG:3857");
            //var mercator = new ol.proj.Projection({ code: 'EPSG:4326' });
            //ol.proj.addProjection(mercator);

            // Australia Bounds
            australia_bounds = new ol.extent.boundingExtent([111,-10],[152,-44]);
            // ^^ THAT SHOULD PROBABLY BE FOUR COMPLETE COORDINATES
            //australia_bounds.extend(new OpenLayers.LonLat(111,-10));
            //australia_bounds.extend(new OpenLayers.LonLat(152,-44));
            //australia_bounds = australia_bounds.transform(geographic, mercator);
            //var zoom_bounds = australia_bounds;

            var visLayers = new ol.layer.Group({
                title: 'Layers',
                layers: [
                ]
            });

            map = new ol.Map({
                target: id,
                layers: [
                    new ol.layer.Group({
                        'title': 'Base maps',
                        layers: [
                            new ol.layer.Tile({
                                source: new ol.source.OSM()
                            }),
                        ],
                    }),
                    visLayers
                ],
                view: new ol.View({
                  center: ol.proj.transform([133, -27], 'EPSG:4326', 'EPSG:3857'),
                  zoom: 4
                })
                /*eventListeners: {
                    "changelayer": mapLayerChanged
                }*/
            });

            map.getView().fitExtent(australia_bounds, map.getSize());

            var layerSwitcher = new ol.control.LayerSwitcher({
                tipLabel: 'Layers' // Optional label for button
            });
            map.addControl(layerSwitcher);

            //loading_panel = new OpenLayers.Control.LoadingPanel();
            //map.addControl(loading_panel);

            // Base layers
            /*var osm = new OpenLayers.Layer.OSM();
            var gmap = new OpenLayers.Layer.Google("Google Streets", {visibility: false});

            var ls = new OpenLayers.Control.LayerSwitcher();

            map.addLayers([osm, gmap]);
            map.addControl(ls);
            map.zoomToExtent(zoom_bounds);

            // Make the layer switcher open by default
            ls.maximizeControl();

            // Remove all the existing data layers, keep the baselayers and map.
            var dataLayers = map.getLayersBy('isBaseLayer', false);
            $.each(dataLayers, function(i){
                map.removeLayer(dataLayers[i]);
            });
            // Remove any existing legends.
            $('.olLegend').remove();*/

            var responseSuccess = false;

            $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                responseSuccess = true;

                /*var visLayers = new ol.layer.Group({
                    title: 'Layers',
                    layers: [
                    ]
                });*/
                var layerName;

                // check for layers metadata, if none exists then the request is returning a data like a csv file
                if ( $.isEmptyObject(data.layers) ) {
                    // single layer
                    // TODO: use data.title (needs to be populated)
                    if(data.description!=''){
                        layerName = data.description;
                    } else {
                        layerName = 'Data Overlay';
                    }
                    var newLayer;
                    if (type !== 'occurence'){
                        newLayer = new ol.layer.Tile({
                            title: layerName,
                            source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                                url: visualiserWMS,
                                params: {
                                    DATA_URL: data.vizurl,   // The data_url the user specified
                                    SLD_BODY: vizcommon.generateSLD(data.filename, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint),
                                    layers: "DEFAULT",
                                    transparent: "true",
                                    format: "image/png"
                                }
                            }))
                        });
                        var legend = {}; legend.name = data.filename;
                        vizcommon.createLegend(legend, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
                    } else {
                        newLayer = new ol.layer.Tile({
                            title: layerName,
                            source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                                url: visualiserWMS,
                                params: {
                                    DATA_URL: data.vizurl,   // The data_url the user specified
                                    layers: "DEFAULT",
                                    transparent: "true",
                                    format: "image/png"
                                }
                            }))
                        });
                    }
                    visLayers.getLayers().push(newLayer);
                } else {
                    // multiple layers

                    var i = 0;
                    $.each( data.layers, function(namespace, layer){
                        layerName = layer_vocab[namespace] || namespace;
                        // DETERMINE VISIBILITY, IF LAYER IS NOMINATED - RENDER IT, IF NOT - DEFAULT TO FIRST
                        i += 1;
                        var isVisible;
                        // if a layer is specified to render first, make it visible
                        if (typeof visibleLayer !== 'undefined') {
                            if (layer.filename == visibleLayer) {
                                isVisible = true;
                                var legend = {}; legend.name = layerName;
                                vizcommon.createLegend(legend, id, layer.min, layer.max, 20);
                            } else {
                                isVisible = false;
                            }
                        } else {
                            if (i == 1){
                                isVisible = true;
                                var legend = {}; legend.name = layerName;
                                vizcommon.createLegend(legend, id, layer.min, layer.max, 20);
                            } else {
                                isVisible = false;
                            }
                        }

                        var newLayer = new ol.layer.Tile({
                            title: layerName,
                            visible: isVisible,
                            source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                                url: visualiserWMS,
                                params: {
                                    DATA_URL: data.vizurl + ('filename' in layer ? '#' + layer.filename : ''),  // The data_url the user specified
                                    SLD_BODY: vizcommon.generateSLD(layer.filename, layer.min, layer.max, 20),
                                    layers: "DEFAULT",
                                    transparent: "true",
                                    format: "image/png"
                                },
                            }))
                        });
                        visLayers.getLayers().push(newLayer);
                    });
                }

                //map.addLayers(visLayers);
                layerSwitcher.renderPanel();
                layerSwitcher.showPanel();
            });
            setTimeout(function() {
                if (!responseSuccess) {
                    alert("Could not find metadata for layer. There may be a problem with the dataset. Try again later, or re-upload the dataset.");
                }
            }, 5000);

            // eventListener which only allows one overlay to displayed at a time
            function mapLayerChanged(event) {
                ls.dataLayers.forEach(function(dataLayer) {
                    if (dataLayer.layer.name == event.layer.name && event.layer.visibility) {
                        dataLayer.layer.visibility = true;
                        dataLayer.layer.display(true);
                        // create a legend if type requires it
                        if (type != 'occurence'){
                            vizcommon.createLegend(dataLayer.layer, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
                        }
                    }
                    else {
                        dataLayer.layer.visibility = false;
                        dataLayer.layer.display(false);
                    }
                });
            }

            container.addClass('active');
        }

        // RENDER PNG IMAGES
        function renderPng(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('olMap')) {
                window.map.destroy();
                container.removeClass('olMap')
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
