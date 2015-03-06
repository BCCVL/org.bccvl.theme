
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'OpenLayers',
             'js/bccvl-visualiser-loading-panel', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable'],
            function( $, preview, openLayers, LoadingPanel, vizcommon  ) {

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

            // destroy and html from images or text files
            container.html('').height(container.parents('.tab-pane').height());

            window.map;
            var mercator, geographic;
            var loading_panel;

            // DecLat, DecLng
            geographic = new OpenLayers.Projection("EPSG:4326");

            // Spherical Meters
            // The official name for the 900913 (google) projection
            mercator = new OpenLayers.Projection("EPSG:3857");

            // Australia Bounds
            australia_bounds = new OpenLayers.Bounds();
            australia_bounds.extend(new OpenLayers.LonLat(111,-10));
            australia_bounds.extend(new OpenLayers.LonLat(152,-44));
            australia_bounds = australia_bounds.transform(geographic, mercator);
            var zoom_bounds = australia_bounds;

            map = new OpenLayers.Map(id, {
                projection: mercator,
                eventListeners: {
                    "changelayer": mapLayerChanged
                }
            });

            loading_panel = new OpenLayers.Control.LoadingPanel();
            map.addControl(loading_panel);

            // Base layers
            var osm = new OpenLayers.Layer.OSM();
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
            $('.olLegend').remove();

            var responseSuccess = false;

            $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                responseSuccess = true;

                var myLayers = [];

                // check for layers metadata, if none exists then the request is returning a data like a csv file
                if ( $.isEmptyObject(data.layers) ) {
                    //single layer
                    var layerName;
                    // TODO: use data.title (needs to be populated)
                    if(data.description!=''){
                        layerName = data.description;
                    } else {
                        layerName = 'Data Overlay';
                    }
                    if (type !== 'occurence'){
                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layerName+'', // Layer Name
                            (visualiserWMS),    // Layer URL
                            {
                                DATA_URL: data.vizurl,   // The data_url the user specified
                                SLD_BODY: vizcommon.generateSLD(data.filename, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint),
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false
                            }
                        );
                        var legend = {}; legend.name = data.filename;
                        vizcommon.createLegend(legend, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
                    } else {
                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layerName+'', // Layer Name
                            (visualiserWMS),    // Layer URL
                            {
                                DATA_URL: data.vizurl,   // The data_url the user specified
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false
                            }
                        );
                    }
                    myLayers.push(newLayer);
                } else {
                    // multiple layers
                    var i = 0;
                    $.each( data.layers, function(namespace, layer){

                        // DETERMINE VISIBILITY, IF LAYER IS NOMINATED - RENDER IT, IF NOT - DEFAULT TO FIRST
                        i += 1;
                        var isVisible;
                        // if a layer is specified to render first, make it visible
                        if (typeof visibleLayer !== 'undefined') {
                            if (layer.filename == visibleLayer) {
                                isVisible = true;
                                var legend = {}; legend.name = layer_vocab[namespace];
                                vizcommon.createLegend(legend, id, layer.min, layer.max, 20);
                            } else {
                                isVisible = false;
                            }
                        } else {
                            if (i == 1){
                                isVisible = true;
                                var legend = {}; legend.name = layer_vocab[namespace];
                                vizcommon.createLegend(legend, id, layer.min, layer.max, 20);
                            } else {
                                isVisible = false;
                            }
                        }

                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layer_vocab[namespace]+'', // Layer Name
                            (visualiserWMS),    // Layer URL
                            {
                                DATA_URL: data.vizurl + ('filename' in layer ? '#' + layer.filename : ''),  // The data_url the user specified
                                SLD_BODY: vizcommon.generateSLD(layer.filename, layer.min, layer.max, 20),
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false,
                                visibility: isVisible
                            }
                        );
                        myLayers.push(newLayer);
                    });
                }

                map.addLayers(myLayers);
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
            if (container.hasClass('olMap'))
                window.map.destroy();
                container.removeClass('olMap')

            container.height('auto').html('<img src="'+url+'" alt="" />').addClass('active');
        }

        // RENDER CODE
        function renderCode(uuid, url, id){
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('olMap'))
                window.map.destroy();
                container.removeClass('olMap');

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
            if (container.hasClass('olMap'))
                window.map.destroy();
                container.removeClass('olMap');

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

    }
);
