
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'OpenLayers',
             'js/bccvl-visualiser-loading-panel', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable'],
            function( $, preview, openLayers, LoadingPanel, vizcommon ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        renderBase($('.bccvl-preview-pane:visible').attr('id'));

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            addNewLayer($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'auto');
            $(this).next('a.bccvl-remove-viz').show(0);
            $(this).hide(0);
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();
            map.removeLayer(map.getLayersByName($(this).data('layername'))[0]);
            $('.olLegend label[data-uuid="'+$(this).data('uuid')+'"]').remove();
            $(this).prev('a.bccvl-compare-viz').show(0);
            $(this).hide(0);
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        var styleArray = [{
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:139,g:208,b:195},"endpoint":{r:18,g:157,b:133}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:154,g:203,b:237},"endpoint":{r:47,g:150,b:220}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:198,g:162,b:214},"endpoint":{r:143,g:76,b:176}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:154,g:164,b:175},"endpoint":{r:48,g:71,b:94}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:233,g:170,b:129},"endpoint":{r:210,g:96,b:19}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:151,g:229,b:184},"endpoint":{r:45,g:195,b:108}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:248,g:225,b:135},"endpoint":{r:241,g:196,b:15}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:223,g:156,b:149},"endpoint":{r:192,g:57,b:43}
            },
            {
                "minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:255,g:172,b:236},"endpoint":{r:247,g:108,b:215}
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
            $('#'+id+' .olMapViewport').append(legend);
        }

        createLegendBox($('.bccvl-preview-pane:visible').attr('id'));

        function addLayerLegend(layername, color, uuid){
            colorRGB = 'rgba('+color.r+','+color.g+','+color.b+',1)';
            $('.olLegend').append('<label data-uuid="'+uuid+'"><i style="background:'+colorRGB+'"></i>&nbsp;'+layername+'</label>');
            $('.olLegend').show(0);
        }

        // RENDER EMPTY MAP
        function renderBase(id){
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
                projection: mercator
            });

            loading_panel = new OpenLayers.Control.LoadingPanel();
            map.addControl(loading_panel);

            // Base layers
            var osm = new OpenLayers.Layer.OSM();
            var gmap = new OpenLayers.Layer.Google("Google Streets", {visibility: false});

            map.addLayers([osm, gmap]);
            map.zoomToExtent(zoom_bounds);

            // Remove any existing legends.
            $('.olLegend').remove();

            container.addClass('active');
        }

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function addNewLayer(uuid, url, id, type){

            var responseSuccess = false;

            var numLayers = map.getLayersBy('isBaseLayer', false).length;

            if (numLayers > 9) {
                alert('This interface supports a maximum of ten layers, please remove a layer before adding another.');
            } else {

                $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                    responseSuccess = true;

                    var myLayers = [];
                    // check for layers metadata, if none exists then the request is returning a data like a csv file
                    if ( $.isEmptyObject(data.layers) ) {
                        //single layer
                        var layerName;
                        // TODO: use data.title (needs to be populated)
                        if(data.filename!=''){
                            layerName = data.filename;
                        } else {
                            layerName = 'Data Overlay';
                        }
                        if (type !== 'occurence'){
                            var newLayer = new OpenLayers.Layer.WMS(
                                ''+layerName+'', // Layer Name
                                (visualiserWMS),    // Layer URL
                                {
                                    DATA_URL: data.vizurl,   // The data_url the user specified
                                    SLD_BODY: vizcommon.generateSLD(data.filename, styleArray[numLayers].minVal, styleArray[numLayers].maxVal, styleArray[numLayers].steps, styleArray[numLayers].startpoint, styleArray[numLayers].midpoint, styleArray[numLayers].endpoint),
                                    layers: "DEFAULT",
                                    transparent: "true",
                                    format: "image/png"
                                },
                                {
                                    isBaseLayer: false
                                }
                            );
                            var legend = {}; legend.name = data.filename;
                            addLayerLegend(data.filename, styleArray[numLayers].endpoint, uuid);
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
                        newLayer.setOpacity(0.5);
                        myLayers.push(newLayer);
                    } else {
                        // multiple layers
                        var i = 0;
                        $.each( data.layers, function(namespace, layer){

                            var newLayer = new OpenLayers.Layer.WMS(
                                ''+layer.label+'', // Layer Name
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
                            //newLayer.setOpacity(0.25);
                            myLayers.push(newLayer);
                        });
                    }

                    map.addLayers(myLayers);

                    /* Code to assign averaged opacity between layers, not currently in use.

                    var numLayers = map.getLayersBy('isBaseLayer', false).length;
                    if (numLayers > 0){
                        $.each(map.getLayersBy('isBaseLayer', false), function(){
                            $(this)[0].setOpacity(Math.round((0.9/numLayers*100))/100);
                        });
                    } */
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
