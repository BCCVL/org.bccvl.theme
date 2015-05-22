
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable', 'jquery-xmlrpc'],
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
            if (container.hasClass('active'))
                container.empty();
                delete window.map;
                //window.map.destroy();


            // destroy any html from images or text files
            //container.html('').height(container.parents('.tab-pane').height());

            window.map;

            // Australia Bounds
            
            var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
            var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
            australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);


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
                        ],
                    }),
                    visLayers
                ],
                view: new ol.View({
                  center: ol.proj.transform([133, -27], 'EPSG:4326', 'EPSG:3857'),
                  zoom: 4
                })
            });



            map.getView().fitExtent(australia_bounds, map.getSize());

            var layerSwitcher = new ol.control.LayerSwitcher({
                toggleOpen: true,
                singleVisibleOverlay: true
            });

            map.addControl(layerSwitcher);


            var fullScreenToggle = new ol.control.FullScreen();
            map.addControl(fullScreenToggle);
            // remove crappy unicode icon so fontawesome can get in
            $('#'+id+' button.ol-full-screen-false').html('');

            $.xmlrpc({
                url: dmurl,
                params: {'datasetid': uuid},
                success: function(data, status, jqXHR) {
                // xmlrpc returns an array of results
                data = data[0];

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
                            type: 'wms',
                            preload: 10,
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
                            type: 'wms-occurence',
                            preload: 10,
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
                        console.log(layer);

                        if (layer.datatype == 'continuous'){
                            console.log('probability');
                            var newLayer = new ol.layer.Tile({
                                title: layerName,
                                type: 'wms',
                                visible: isVisible,
                                preload: 10,
                                source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                                    url: visualiserWMS,
                                    params: {
                                        DATA_URL: data.vizurl + ('filename' in layer ? '#' + layer.filename : ''),  // The data_url the user specified
                                        SLD_BODY: vizcommon.generateSLD(layer.filename, layer.min, layer.max, 20, null, null, null, layer.datatype),
                                        layers: "DEFAULT",
                                        transparent: "true",
                                        format: "image/png"
                                    },
                                }))
                            });
                        } else {
                            var newLayer = new ol.layer.Tile({
                                title: layerName,
                                type: 'wms',
                                visible: isVisible,
                                preload: 10,
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
                        }
                        
                        visLayers.getLayers().push(newLayer);
                    });
                }

                layerSwitcher.renderPanel();
                layerSwitcher.showPanel();

                var currentLayers = visLayers.getLayers().getArray();

                $.each(currentLayers, function(i, lyr){
                    lyr.on('change:visible', function(e){
                        if (lyr.getVisible()){
                            var legend = {}; legend.name = lyr.get('title');
                            vizcommon.createLegend(legend, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
                        }
                    });
                });

                vizcommon.exportAsImage(id, map, currentLayers, data.title);

            }});

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
