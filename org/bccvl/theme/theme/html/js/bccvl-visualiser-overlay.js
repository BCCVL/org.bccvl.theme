
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common'],
            function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        renderBase($('.bccvl-preview-pane:visible').attr('id'));

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            var viztype = $(this).data('viz-type') || 'auto';
            addNewLayer($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), viztype, $(this).data('layername'));
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();

            var layerTitle = $(this).data('layername');

            visLayers.getLayers().forEach(function (lyr) {
                if ( lyr.get('title') == layerTitle){
                    visLayers.getLayers().remove(lyr);
                }          
            })

            /*map.getLayers().forEach(function (lyr) {
                if ( lyr.get('title') == layerTitle){
                    map.removeLayer(lyr);
                }          
            })*/;

            //map.removeLayer(map.getLayersByName($(this).data('layername'))[0]);
            $('.olLegend label[data-uuid="'+$(this).data('uuid')+'"]').remove();
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
                

        var styleArray = [{
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:139,g:208,b:195},"endpoint":{r:18,g:157,b:133}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:233,g:170,b:129},"endpoint":{r:210,g:96,b:19}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:255,g:172,b:236},"endpoint":{r:247,g:108,b:215}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:248,g:225,b:135},"endpoint":{r:241,g:196,b:15}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:198,g:162,b:214},"endpoint":{r:143,g:76,b:176}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:154,g:164,b:175},"endpoint":{r:48,g:71,b:94}
            },  
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:151,g:229,b:184},"endpoint":{r:45,g:195,b:108}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:154,g:203,b:237},"endpoint":{r:47,g:150,b:220}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:223,g:156,b:149},"endpoint":{r:192,g:57,b:43}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:154,g:154,b:154},"endpoint":{r:47,g:47,b:47}
            }
        ];

        function createLegendBox(id){
            // have to make a new legend for each layerswap, as layer positioning doesn't work without an iframe
            $('.olLegend').remove();
            // Build legend obj
            var legend = document.createElement('div');
            legend.className = 'olLegend';
            $('#'+id+' .ol-viewport').append(legend);
        }

        createLegendBox($('.bccvl-preview-pane:visible').attr('id'));

        function addLayerLegend(layername, color, uuid){  
            if (color == 'occurrence'){
                $('.olLegend').append('<label data-uuid="'+uuid+'" style="padding-top:1px;"><i style="color:red;text-align:center;margin-top:3px;" class="fa fa-circle"></i>&nbsp;'+layername+'</label>');
                $('.olLegend').show(0);
            } else {
                colorRGB = 'rgba('+color.r+','+color.g+','+color.b+',1)';
                $('.olLegend').append('<label data-uuid="'+uuid+'"><i style="background:'+colorRGB+'"></i>&nbsp;'+layername+'</label>');
                $('.olLegend').show(0);
            }
        }

        // RENDER EMPTY MAP
        function renderBase(id){
            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            if (container.hasClass('olMap'))
                window.map.destroy();

            // destroy any html from images or text files
            container.html('');

            window.map;
            window.visLayers;
            //var mercator, geographic;
            //var loading_panel;

            // DecLat, DecLng
            //geographic = new OpenLayers.Projection("EPSG:4326");

            // Spherical Meters
            // The official name for the 900913 (google) projection

            // Australia Bounds
            
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
        }

        /*function currentLayers(){
            var layers = []; 

            map.getLayers().forEach(function (lyr) {
                if (lyr.get('type') !== 'base' && lyr.get('type') !== undefined){
                    layers.push(lyr);
                }
            });
            
            return layers;
        }*/

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function addNewLayer(uuid, url, id, type, layerName){

            var responseSuccess = false;

            //var numLayers = map.getLayersBy('isBaseLayer', false).length;
            var numLayers = visLayers.getLayers().getArray().length;
            console.log(numLayers)
            //onsole.log(numLayers)

            if (numLayers > 9) {
                alert('This interface supports a maximum of ten layers, please remove a layer before adding another.');
            } else {

                $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                    
                    responseSuccess = true;

                    // Get number of layers in request, there are faster methods to do this, but this one is the most compatible
                    var layers = data.layers;
                    var layersInSet=0;
                    for(var key in layers) {
                        if(layers.hasOwnProperty(key)){
                            layersInSet++;
                        }
                    }
                    
                    // check for layers metadata, if none exists then the request is returning a data like a csv file
                    if ( layersInSet == 1 || $.isEmptyObject(data.layers) ) {
                        //single layer
                        
                        // TODO: use data.title (needs to be populated)
                        if(!layerName) {
                            if( data.filename!=''){
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
                                        SLD_BODY: vizcommon.generateSLD(data.filename, styleArray[numLayers].minVal, styleArray[numLayers].maxVal, styleArray[numLayers].steps, styleArray[numLayers].startpoint, styleArray[numLayers].midpoint, styleArray[numLayers].endpoint),
                                        layers: "DEFAULT",
                                        transparent: "true",
                                        format: "image/png"
                                    }
                                }))
                            });
                            var legend = {}; legend.name = data.filename;
                            addLayerLegend(layerName, styleArray[numLayers].endpoint, uuid);
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
                            var legend = {}; legend.name = layerName;
                            addLayerLegend(layerName, 'occurrence', uuid);                            
                        }
                        newLayer.setOpacity(1);
                        visLayers.getLayers().push(newLayer);
                        //map.addLayer(newLayer);
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
                            var legend = {}; legend.name = layerName;
                            addLayerLegend(layerName, styleArray[numLayers].endpoint, uuid);                            
                            //newLayer.setOpacity(0.25);
                            visLayers.getLayers().push(newLayer);
                            //map.addLayer(newLayer);
                        });
                    }

                    //map.addLayers(myLayers);

                    /* Code to assign averaged opacity between layers, not currently in use.

                    var numLayers = map.getLayersBy('isBaseLayer', false).length;
                    if (numLayers > 0){
                        $.each(map.getLayersBy('isBaseLayer', false), function(){
                            $(this)[0].setOpacity(Math.round((0.9/numLayers*100))/100);
                        });
                    } */
                    // update list of real layers
                    //map.currentLayers = currentLayers();
                    map.render();
                });
                setTimeout(function() {
                    if (!responseSuccess) {
                        alert("Could not find metadata for layer. There may be a problem with the dataset. Try again later, or re-upload the dataset.");
                    }
                }, 5000);

            }
        }

    }
);
