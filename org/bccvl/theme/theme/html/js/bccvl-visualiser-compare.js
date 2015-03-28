
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'OpenLayers',
             'js/bccvl-visualiser-loading-panel', 'js/bccvl-visualiser-common'],
            function( $, preview, openLayers, LoadingPanel, vizcommon ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        console.log('hello!');

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            $('.bccvl-preview-pane:visible').append('<div class="minimap" id="minimap_'+$(this).data('uuid')+'"></div>');
            var viztype = $(this).data('viz-type') || 'auto';
            renderNewMap($(this).data('uuid'),$(this).data('viz-id'), 'minimap_'+$(this).data('uuid'), viztype, $(this).data('layername'));
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();
            var uuid = $(this).data('uuid');
            $('#minimap_'+uuid).remove();
            delete window.maps[uuid];  
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
                
        var styleObj = {"minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:231,g:76,b:60},"endpoint":{r:192,g:57,b:43}};

        
        window.maps = {};
        // RENDER EMPTY MAP
                function renderNewMap(uuid, url, id, type, layerName){
            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            //if (container.hasClass('olMap'))
            //    window.map.destroy();

            // destroy and html from images or text files
            //container.html('').height(container.parents('.tab-pane').height());

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
                projection: mercator
            });

            loading_panel = new OpenLayers.Control.LoadingPanel();
            map.addControl(loading_panel);

            // Base layers
            var osm = new OpenLayers.Layer.OSM();
            var gmap = new OpenLayers.Layer.Google("Google Streets", {visibility: false});

            //var ls = new OpenLayers.Control.LayerSwitcher();

            map.addLayers([osm, gmap]);
            //map.addControl(ls);
            
            if (window.mapsCenter && window.mapsZoom){
                map.setCenter(window.mapsCenter, window.mapsZoom, false, false);
            } else {
                map.zoomToExtent(zoom_bounds);
            }

            // Remove any existing legends.
            $('.olLegend').remove();

            var responseSuccess = false;

            $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                responseSuccess = true;

                var myLayers = [];

                // check for layers metadata, if none exists then the request is returning a data like a csv file
                if ( $.isEmptyObject(data.layers) ) {
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
                        //createLegend(legend, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
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
                    container.append('<label>'+layerName+'</label>')
                    newLayer.setOpacity(0.9);
                    myLayers.push(newLayer);
                } else {
                    // multiple layers
                    var i = 0;
                    $.each( data.layers, function(namespace, layer){
                        layerName = layer_vocab[namespace] || namespace;

                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layerName+'', // Layer Name
                            (visualiserWMS),    // Layer URL
                            {
                                DATA_URL: data.vizurl + ('filename' in layer ? '#' + layer.filename : ''),  // The data_url the user specified
                                SLD_BODY: vizcommon.generateSLD(layer.filename, layer.min, layer.max, 20),
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false
                            }
                        );
                        container.append('<label>'+layerName+'</label>')
                        //newLayer.setOpacity(0.25);
                        myLayers.push(newLayer);
                    });
                }

                map.addLayers(myLayers);

                var numLayers = map.getLayersBy('isBaseLayer', false).length;
                if (numLayers > 0){
                    $.each(map.getLayersBy('isBaseLayer', false), function(){
                        $(this)[0].setOpacity(Math.round((0.9/numLayers*100))/100);
                    });
                } 

                controls = map.getControlsByClass('OpenLayers.Control.Navigation');
 
                for(var i = 0; i < controls.length; ++i)
                     controls[i].disableZoomWheel();

                window.maps[uuid] = map;

                var is_syncing = false;
                window.maps[uuid].events.register("moveend", window.maps[uuid], function(event) {
                    if (!is_syncing) {
                        is_syncing = true;
                        var center = window.maps[uuid].getCenter();
                        var zoom = window.maps[uuid].getZoom();
                        $.each(window.maps, function(i, otherMap){
                            otherMap.setCenter(center, zoom, false, false); 
                        });

                        window.mapsCenter = center;
                        window.mapsZoom = zoom;
                        is_syncing = false;
                    }
                }); 
                
            });
            setTimeout(function() {
                if (!responseSuccess) {
                    alert("Could not find metadata for layer. There may be a problem with the dataset. Try again later, or re-upload the dataset.");
                }
            }, 5000);
            container.addClass('active');
            
        }

    }
);
