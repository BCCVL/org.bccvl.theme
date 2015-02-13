
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'OpenLayers',
             'js/bccvl-visualiser-loading-panel', 'prism', 'jquery-csvtotable'],
            function( $  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        renderBase($('.bccvl-preview-pane:visible').attr('id'));

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            addNewLayer($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'auto');

            $(this).next('a.bccvl-remove-viz').show(0);
            $(this).hide(0);
            //registerRemoveLayer($(this));
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();
            map.removeLayer(map.getLayersByName($(this).data('layername'))[0]);
            $(this).prev('a.bccvl-compare-viz').show(0);
            $(this).hide(0);
            //element.attr('class', '.bccvl-compare-viz').html('<i class="icon-eye-open icon-link"></i>');
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        /* FUNCTIONS FOR CREATING COLOR SPECTRUMS AND CONSTRUCTING XML SLD DOCUMENTS TO PASS TO MAP TILE REQUESTS */
        // -------------------------------------------------------------------------------------------

        var styleObj = {"minVal":0,"maxVal":1,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:231,g:76,b:60},"endpoint":{r:192,g:57,b:43}};

        /*  Goal here is to determine minimum and maximum raster values in the map layer,
            dividing it by an arbitrary number of levels.  This is then used to make an array
            of thresholds for color values to be associated with.
        */

        /*  Important to note here that due to the structure of an SLD doc, the number of
            threshold values must always be one more than the number of desired color levels.
            The number of color values must then be one greater than the thresholds.
            SLD requests are packed like: Color-Threshold-*colorlevel*-Color...., so the end
            result will always have +1 threshold and +2 color values on top of your desired number of colour values.
        */

        function generateRangeArr(standard_range, minVal, maxVal, steps){

            if (standard_range == 'rainfall'){
                // rainfall BOM standard range
                var rangeArr = [0,200,300,400,500,600,800,1000,1200,1600,2000,2400,3200];
            } else if (standard_range == 'temperature') {
                // temperature BOM standard range
                var rangeArr = [-3,0,3,6,9,12,15,18,21,24,27,30,33,36,39];
            } else {
                // dummy max and min values, eventually replaced with relative-to-layer values
                if (minVal==undefined) minVal = 0;
                if (maxVal==undefined) maxVal = 215;
                if (steps==undefined) steps = 20; // must be even number for 3 color phase to work

                var rangeInt = (maxVal - minVal)/steps;
                var rangeArr = [];
                for (var i = 0; i < (steps+1); i++) {
                    rangeArr.push((rangeInt*i).toFixed(2));
                }
            }

            return rangeArr;
        }

        function generateColorArr(standard_range, steps, startpoint, midpoint, endpoint){
            /*  Generate array of hexidecimal colour values, note the extra value on top of threshold range. */
            if (standard_range == 'rainfall'){
                // rainfall BOM standard colours
                var colorArr = ['#FFFFFF','#fffee8','#fefdd1','#f6f8ab','#daeca2','#c1e3a3','#a8dba4','#8cd1a4','#6fc9a5','#45c1a4','#00b4a5','#00999a','#017b7d','#005b5c'];
            } else if (standard_range == 'temperature') {
                // temperature BOM standard colours
                var colorArr = ['#13a7ce','#0eb9d2','#54c5d2','#87d2d1','#b1e0d3','#c6e6d3','#d8eed4','#ecf6d5','#fefed7','#fef5bd','#fdea9b','#fcd78b','#fdc775','#f8a95b','#f58e41','#f3713e'];
            } else {
                // utility functions to convert RGB values into hex values for SLD styling.
                function byte2Hex(n) {
                    var nybHexString = "0123456789ABCDEF";
                    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
                }
                function RGB2Color(r,g,b) {
                    return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
                }

                var colorArr = [];

                if (midpoint != null){
                    // White to blue spectrum
                    if (startpoint==undefined) {
                        var startpoint = {};
                            startpoint.r = 255;
                            startpoint.g = 251;
                            startpoint.b = 193;
                    }
                    if (midpoint==undefined) {
                        var midpoint = {};
                            midpoint.r = 195;
                            midpoint.g = 120;
                            midpoint.b = 13;
                    }
                    if (endpoint==undefined) {
                        var endpoint = {};
                            endpoint.r = 75;
                            endpoint.g = 48;
                            endpoint.b = 0;
                    }

                    // first half
                    for (var i = 0; i < ((steps/2)+1); i++) {
                        // red
                        var redInt = (startpoint.r - midpoint.r)/(steps/2);
                        var redVal = startpoint.r - (redInt*i);
                        // green
                        var greenInt = (startpoint.g - midpoint.g)/(steps/2);
                        var greenVal = startpoint.g - (greenInt*i);
                        // blue
                        var blueInt = (startpoint.b - midpoint.b)/(steps/2);
                        var blueVal = startpoint.b - (blueInt*i);

                        colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                    }

                    // second half
                    for (var i = 0; i < ((steps/2)+1); i++) {
                        // red
                        var redInt = (midpoint.r - endpoint.r)/(steps/2);
                        var redVal = midpoint.r - (redInt*i);
                        // green
                        var greenInt = (midpoint.g - endpoint.g)/(steps/2);
                        var greenVal = midpoint.g - (greenInt*i);
                        // blue
                        var blueInt = (midpoint.b - endpoint.b)/(steps/2);
                        var blueVal = midpoint.b - (blueInt*i);

                        colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                    }
                } else {
                    // White to blue spectrum
                    if (startpoint==undefined) {
                        var startpoint = {};
                            startpoint.r = 255;
                            startpoint.g = 255;
                            startpoint.b = 255;
                    }
                    if (endpoint==undefined) {
                        var endpoint = {};
                            endpoint.r = 30;
                            endpoint.g = 77;
                            endpoint.b = 155;
                    }

                    for (var i = 0; i < (steps+2); i++) {
                        // red
                        var redInt = (startpoint.r - endpoint.r)/steps;
                        var redVal = startpoint.r - (redInt*i);
                        // green
                        var greenInt = (startpoint.g - endpoint.g)/steps;
                        var greenVal = startpoint.g - (greenInt*i);
                        // blue
                        var blueInt = (startpoint.b - endpoint.b)/steps;
                        var blueVal = startpoint.b - (blueInt*i);

                        colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                    }
                }
            }
            return colorArr;
        }

        function generateSLD(filename, minVal, maxVal, steps, startpoint, midpoint, endpoint ) {
            var standard_range;

            if(/bioclim_12|bioclim_17|bioclim_16|bioclim_18|bioclim_13|bioclim_19|bioclim_15|bioclim_14/g.test(filename)){
                var standard_range = 'rainfall';
            } else if(/bioclim_11|bioclim_10|bioclim_02|bioclim_03|bioclim_01|bioclim_06|bioclim_07|bioclim_04|bioclim_05|bioclim_08|bioclim_09/g.test(filename)){
                var standard_range = 'temperature';
            } else {
                var standard_range = 'soil';
            }

            var rangeArr = generateRangeArr(standard_range, minVal, maxVal, steps);
            var colorArr = generateColorArr(standard_range, steps, startpoint, midpoint, endpoint);

            var xmlStylesheet = '<StyledLayerDescriptor version="1.1.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><se:Name>DEFAULT</se:Name><UserStyle><se:Name>xxx</se:Name><se:FeatureTypeStyle><se:Rule><se:RasterSymbolizer><se:Opacity>1</se:Opacity><se:ColorMap><se:Categorize fallbackValue="#78c818"><se:LookupValue>Rasterdata</se:LookupValue>';

            for (var i = 0; i < (steps+1); i++) {
                xmlStylesheet += '<se:Value>'+colorArr[i]+'</se:Value><se:Threshold>'+rangeArr[i]+'</se:Threshold>';
            }

            xmlStylesheet += '<se:Value>'+colorArr[colorArr.length-1]+'</se:Value>';

            xmlStylesheet += '</se:Categorize></se:ColorMap></se:RasterSymbolizer></se:Rule></se:FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';

            return xmlStylesheet;
        }

        /* END SLD GENERATION */

        /* FUNCTIONS FOR CREATING LEGEND */
        // -------------------------------------------------------------------------------------------

        function createLegend(layer, id, minVal, maxVal, steps, startpoint, midpoint, endpoint) {
            // have to make a new legend for each layerswap, as layer positioning doesn't work without an iframe
            $('.olLegend').remove();

            var standard_range;

            if(/B12|B17|B16|B18|B13|B19|B15|B14|bioclim_12|bioclim_17|bioclim_16|bioclim_18|bioclim_13|bioclim_19|bioclim_15|bioclim_14/g.test(layer.name)){
                var standard_range = 'rainfall';
            } else if(/B11|B10|B02|B03|B01|B06|B07|B04|B05|B08|B09|bioclim_11|bioclim_10|bioclim_02|bioclim_03|bioclim_01|bioclim_06|bioclim_07|bioclim_04|bioclim_05|bioclim_08|bioclim_09/g.test(layer.name)){
                var standard_range = 'temperature';
            } else {
                var standard_range = 'probability';
            }
            // Get hex color range and map values
            var rangeArr = generateRangeArr(standard_range, minVal, maxVal, steps);
            var colorArr = generateColorArr(standard_range, steps, startpoint, midpoint, endpoint);
            // Build legend obj
            var legend = document.createElement('div');
            legend.className = 'olLegend';
            if (standard_range == 'rainfall'){
                legend.innerHTML = '<h5>Units (mm)</h5>';
                for (var i = 0; i < (rangeArr.length); i = i+1) {
                    if (i == (rangeArr.length-1)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;+</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;-&nbsp;'+Math.round(rangeArr[i+1])+'</label>';
                    }
                }
            } else if (standard_range == 'temperature') {
                legend.innerHTML = '<h5>Units (&deg;C)</h5>';
                for (var i = 0; i < (rangeArr.length); i = i+1) {
                    if (i == (rangeArr.length-1)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;+</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;-&nbsp;'+Math.round(rangeArr[i+1])+'</label>';
                    }
                }
            } else if (standard_range == 'probability') {
                for (var i = 0; i < (steps+1); i = i+2) {
                    if (i == (steps)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+rangeArr[i]+'</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+rangeArr[i]+'&nbsp;-&nbsp;'+rangeArr[i+2]+'</label>';
                    }
                }
            } else {
                legend.innerHTML = '<h5>Units ('+layer.units+')</h5>';
                for (var i = 0; i < (steps+1); i = i+5) {
                    if (i == (steps)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;+</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;-&nbsp;'+Math.round(rangeArr[i+5])+'</label>';
                    }
                }
            }
            // have to make a new legend for each layerswap, as layer positioning doesn't work without an iframe
            $('#'+id+' .olMapViewport').append(legend);
        }

        /* END LEGEND FUNCTION */

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

            var ls = new OpenLayers.Control.LayerSwitcher();

            map.addLayers([osm, gmap]);
            map.addControl(ls);
            map.zoomToExtent(zoom_bounds);

            // Remove any existing legends.
            $('.olLegend').remove();

            container.addClass('active');
        }

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function addNewLayer(uuid, url, id, type){

            var responseSuccess = false;

            $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                responseSuccess = true;
                console.log(data);
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
                                SLD_BODY: generateSLD(data.filename, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint),
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
                    newLayer.setOpacity(0.9);
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
                                SLD_BODY: generateSLD(layer.filename, layer.min, layer.max, 20),
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

                var numLayers = map.getLayersBy('isBaseLayer', false).length;
                if (numLayers > 0){
                    $.each(map.getLayersBy('isBaseLayer', false), function(){
                        $(this)[0].setOpacity(Math.round((0.9/numLayers*100))/100);
                    });
                } 
            });
            setTimeout(function() {
                if (!responseSuccess) {
                    alert("Could not find metadata for layer. There may be a problem with the dataset. Try again later, or re-upload the dataset.");
                }
            }, 5000);

        }

    }
);
