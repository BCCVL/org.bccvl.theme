
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'jquery-xmlrpc'],
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
            $.each(maps, function(i, map){
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

        var maps = [];
        var mapsCenter;
        var mapsZoom;
        // Australia Bounds
        var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
        var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
        var australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);
        
        var layer_vocab = {};
        $.getJSON(portal_url + "/dm/getVocabulary", {name: 'layer_source'}, function(data, status, xhr) {
            $.each(data, function(index, value) {
                layer_vocab[value.token] = value;
            });
        });
        
        // RENDER EMPTY MAP
        function renderNewMap(uuid, url, id, type, layerName, algorithm){
            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                $.each(maps, function(i, map){
                    if (map.uuid == uuid){
                        delete $(this);
                    }
                });
            }
            
            var visLayers = new ol.layer.Group({
                title: 'Layers',
                layers: []
            });
            
            var map = new ol.Map({
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
                            })
                            /*new ol.layer.Tile({
                                title: 'Satellite',
                                type: 'base',
                                visible: false,
                                source: new ol.source.MapQuest({layer: 'sat'})
                            })*/
                        ]
                    }),
                    visLayers
                ],
                view: new ol.View({
                  center: ol.proj.transform([133, -27], 'EPSG:4326', 'EPSG:3857'),
                  zoom: 4
                })
            });

            map.getView().fit(australia_bounds, map.getSize());

            var fullScreenToggle = new ol.control.FullScreen();
            map.addControl(fullScreenToggle);
            // remove crappy unicode icon so fontawesome can get in
            $('#'+id+' button.ol-full-screen-false').html('');

            container.addClass('active');

            // hook up exportAsImage
            $('#'+id+' .ol-viewport').append('<a class="export-map" download="map.png" href=""><i class="fa fa-save"></i> Image</a>');
            $('#'+id+' a.export-map').click(
                { map: map,
                  mapTitle: 'Side-by-side'
                }, vizcommon.exportAsImage);
            
            if (mapsCenter && mapsZoom){
                map.setCenter(mapsCenter, mapsZoom, false, false);
            } else {
                map.getView().fit(australia_bounds, map.getSize());
            }

            // Remove any existing legends.
            $('.olLegend').remove();

            $.xmlrpc({
                url: dmurl,
                params: {'datasetid': uuid},
                success: function(data, status, jqXHR) {
                    // xmlrpc returns an array of results
                    data = data[0];

                    // check for layers metadata, if none exists then the request is returning a data like a csv file
                    if ($.isEmptyObject(data.layers)) {
                        // occurrence data
                        // TODO: use data.title (needs to be populated)
                        layerName = layerName || data.filename || 'Data Overlay';
                        
                        var newLayer = vizcommon.createLayer(uuid, data, data, layerName, 'wms-occurrence', true);
                        if (typeof algorithm != "undefined") {
                            container.append('<label>'+layerName+'<br/> (<em>'+algorithm+'</em>)</label>');
                        } else {
                            container.append('<label>'+layerName+'<br/></label>');
                        }

                        newLayer.setOpacity(0.9);
                        visLayers.getLayers().push(newLayer);
                    } else {
                        // raster data
                        $.each( data.layers, function(layerid, layer){
                            layerName = layer_vocab[layer.layer] ? layer_vocab[layer.layer].title : (layer.layer || layer.filename);

                            var max = vizcommon.roundUpToNearestMagnitude(layer.max);
                            var styleObj = {
                                minVal: 0, // TODO: mahal has negative min value?
                                maxVal: max,
                                steps: 20,
                                startpoint: null,
                                midpoint: null,
                                endpoint: null
                            };
                            var layer_style = layer_vocab[layerid] ? layer_vocab[layerid].color : null;                            
                            var newLayer = vizcommon.createLayer(uuid, data, layer, layerName, 'wms', true, styleObj, null, layer_style);

                            if (typeof algorithm != "undefined") {
                                container.append('<label>'+layerName+'<br/> (<em>'+algorithm+'</em>)</label>');
                            } else {
                                container.append('<label>'+layerName+'<br/></label>');
                            }

                            visLayers.getLayers().push(newLayer);
                        });
                    }
                    map.uuid = uuid;
                    maps.push(map);

                    bindMaps();
                    
                }});

            function bindMaps(){
                var leader = maps[0];
                $.each(maps, function(i, map){
                    if (i>0){
                        // BindTo removed somewhere between OL3.4.x and OL3.7.0
                        //map.bindTo('view', leader);
                        map.setView(leader.getView());
                    }
                });
            }
            
        }
        
    }
);
