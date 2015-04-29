
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'jquery-xmlrpc'],
            function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            $('.bccvl-preview-pane:visible').append('<div class="minimap" id="minimap_'+$(this).data('uuid')+'"></div>');
            var viztype = $(this).data('viz-type') || 'auto';
            renderNewMap($(this).data('uuid'),$(this).data('viz-id'), 'minimap_'+$(this).data('uuid'), viztype, $(this).data('layername'), $(this).data('algorithm'));
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();
            var uuid = $(this).data('uuid');
            $('#minimap_'+uuid).remove();
            $.each(window.maps, function(i, map){
                if (map.uuid == uuid){
                    delete $(this);
                }
            });
            //delete window.maps[uuid];  
            $(this).removeClass('bccvl-remove-viz').addClass('bccvl-compare-viz');
            $(this).find('i').removeClass('icon-eye-close').addClass('icon-eye-open');
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        var layer_vocab = {};
                $.getJSON(portal_url + "/dm/getVocabulary", {name: 'layer_source'}, function(data, status, xhr) {
                    $.each(data, function(index, value) {
                        layer_vocab[value.token] = value.title;
                    });
                });
                
        var styleObj = {"minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:255,g:77,b:30},"endpoint":{r:230,g:0,b:0}};

        
        window.maps = [];
        // RENDER EMPTY MAP
        function renderNewMap(uuid, url, id, type, layerName, algorithm){
            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
        
            var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
            var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
            australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);

            visLayers = new ol.layer.Group({
                title: 'Layers',
                layers: [
                ]
            });

            map = new ol.Map({
                target: id,
                layers: [
                    new ol.layer.Group({
                        'title': 'Base maps',
                        //interactions: ol.interaction.defaults({mouseWheelZoom:false}),
                        layers: [
                            new ol.layer.Tile({
                                title: 'OSM',
                                type: 'base',
                                preload: 10,
                                visible: true,
                                source: new ol.source.OSM()
                            }),
                            /*new ol.layer.Tile({
                                title: 'Satellite',
                                type: 'base',
                                visible: false,
                                source: new ol.source.MapQuest({layer: 'sat'})
                            })*/
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

            var fullScreenToggle = new ol.control.FullScreen();
            map.addControl(fullScreenToggle);
            // remove crappy unicode icon so fontawesome can get in
            $('#'+id+' button.ol-full-screen-false').html('');

            container.addClass('active');

            vizcommon.exportAsImage(id, map, visLayers.getLayers().getArray());
            
            if (window.mapsCenter && window.mapsZoom){
                map.setCenter(window.mapsCenter, window.mapsZoom, false, false);
            } else {
                map.getView().fitExtent(australia_bounds, map.getSize());
            }

            // Remove any existing legends.
            $('.olLegend').remove();

            var responseSuccess = false;

            $.xmlrpc({
                url: dmurl,
                params: {'datasetid': uuid},
                success: function(data, status, jqXHR) {
                    //$.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                    // xmlrpc returns an array of results
                    data = data[0];
                responseSuccess = true;

                // Get number of layers in request, there are faster methods to do this, but this one is the most compatible
                var layers = data.layers;
                var layersInSet=0;
                for(var key in layers) {
                    if(layers.hasOwnProperty(key)){
                        layersInSet++;
                    }
                }
                
                var myLayers = [];
                // check for layers metadata, if none exists then the request is returning a data like a csv file
                if ( layersInSet == 1 || $.isEmptyObject(data.layers) ) {
                    //single layer
                    // TODO: use data.title (needs to be populated)
                    if (!layerName) {
                        if(data.filename!=''){
                            layerName = data.filename;
                        } else {
                            layerName = 'Data Overlay';
                        }
                    }
                    if (type !== 'occurrence'){
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
                        //createLegend(legend, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
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
                    if (typeof algorithm != "undefined") {
                        container.append('<label>'+layerName+'<br/> (<em>'+algorithm+'</em>)</label>');
                    } else {
                        container.append('<label>'+layerName+'<br/></label>');
                    }
                    
                    newLayer.setOpacity(0.9);
                    visLayers.getLayers().push(newLayer);
                } else {
                    // multiple layers
                    var i = 0;
                    $.each( data.layers, function(namespace, layer){
                        layerName = layer_vocab[namespace] || namespace;

                        var newLayer = new ol.layer.Tile({
                            title: layerName,
                            type: 'wms',
                            preload: 10,
                            source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                                    url: visualiserWMS,
                                    params: {
                                    DATA_URL: data.vizurl,   // The data_url the user specified
                                    SLD_BODY: vizcommon.generateSLD(layer.filename, layer.min, layer.max, 20),
                                    layers: "DEFAULT",
                                    transparent: "true",
                                    format: "image/png"
                                }
                            }))
                        });
                        if (typeof algorithm != "undefined") {
                            container.append('<label>'+layerName+'<br/> (<em>'+algorithm+'</em>)</label>');
                        } else {
                            container.append('<label>'+layerName+'<br/></label>');
                        }
                        //newLayer.setOpacity(0.25);
                        visLayers.getLayers().push(newLayer);
                    });
                }

                //map.addLayers(myLayers);

                var numLayers = visLayers.getLayers().getArray().length;
                /*if (numLayers > 0){
                    $.each(map.getLayersBy('isBaseLayer', false), function(){
                        $(this)[0].setOpacity(Math.round((0.9/numLayers*100))/100);
                    });
                } 

                controls = map.getControlsByClass('OpenLayers.Control.Navigation');
 
                for(var i = 0; i < controls.length; ++i)
                     controls[i].disableZoomWheel();*/

                map.uuid = uuid;
                window.maps.push(map);


                bindMaps();
                /*var is_syncing = false;
                window.maps[uuid].events.register("moveend", window.maps[uuid], function(event) {
                    if (!is_syncing) {
                        is_syncing = true;
                        var center = window.maps[uuid].getCenter();
                        var zoom = window.maps[uuid].getZoom();
                        $.each(window.maps, function(i, otherMap){
                            otherMap.setCenter(center)
                            otherMap.setZoom(zoom); 
                        });

                        window.mapsCenter = center;
                        window.mapsZoom = zoom;
                        is_syncing = false;
                    }
                });*/ 

            }});

            function bindMaps(){
                var leader = window.maps[0];
                $.each(window.maps, function(i, map){
                    if (i>0){
                        map.bindTo('view', leader);
                    }
                });
            }
            
            setTimeout(function() {
                if (!responseSuccess) {
                    alert("Could not find metadata for layer. There may be a problem with the dataset. Try again later, or re-upload the dataset.");
                }
            }, 5000);
            container.addClass('active');
            
        }

    }
);
