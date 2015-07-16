
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher'],
   function( $, layout, ol  ) {

        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
           

        var bccvl_common = {

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

            // TODO: make this local to have better timeout error messages and avoid too short timeouts on some ajax calls
            commonAjaxSetup: function(){
                $.ajaxSetup({
                    timeout: 20000,
                    error: function(jqXHR, textStatus, errorThrown){
                        console.log('Error on map: '+textStatus);
                        if (textStatus ==  'timeout'){
                            alert("The request timed out. This can happen for a number of reasons, please try again later.  If the issue persists, contact our support staff via bccvl.org.au.");
                        }
                    }
                });
                
            },

            generateRangeArr: function(standard_range, minVal, maxVal, steps){
                
                if (standard_range == 'rainfall'){
                    // rainfall BOM standard range
                    var rangeArr = [0,200,300,400,500,600,800,1000,1200,1600,2000,2400,3200];
                } else if (standard_range == 'temperature') {
                    // temperature BOM standard range
                    var rangeArr = [-3,0,3,6,9,12,15,18,21,24,27,30,33,36,39];
                } else if (standard_range == 'probability') {
                    
                    if (maxVal <= 1){
                        var rangeArr = [0,0.05,0.10,0.15,0.20,0.25,0.30,0.35,0.40,0.45,0.50,0.55,0.60,0.65,0.70,0.75,0.80,0.85,0.90,0.95,1.00];
                    } else if (maxVal <= 10){
                        var rangeArr = [0,0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,7.5,8.0,8.5,9.0,9.5,10];
                    } else if (maxVal <= 100){
                        var rangeArr = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
                    } else if (maxVal <= 1000){
                        var rangeArr = [0,50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850,900,950,1000];
                    }
                    
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
            },

            generateColorArr: function(standard_range, steps, startpoint, midpoint, endpoint){
                /*  Generate array of hexidecimal colour values, note the extra value on top of threshold range. */
                if (standard_range == 'rainfall'){
                    // rainfall BOM standard colours
                    var colorArr = ['#FFFFFF','#fffee8','#fefdd1','#f6f8ab','#daeca2','#c1e3a3','#a8dba4','#8cd1a4','#6fc9a5','#45c1a4','#00b4a5','#00999a','#017b7d','#005b5c'];
                } else if (standard_range == 'temperature') {
                    // temperature BOM standard colours
                    var colorArr = ['#13a7ce','#0eb9d2','#54c5d2','#87d2d1','#b1e0d3','#c6e6d3','#d8eed4','#ecf6d5','#fefed7','#fef5bd','#fdea9b','#fcd78b','#fdc775','#f8a95b','#f58e41','#f3713e'];
                } else if (standard_range == 'probability') {
                    // basic prob spectrum
                    var colorArr = ['#FFFFFF','#fef8f8','#fdefef','#fce4e4','#fbd8d8','#facbcb','#f9bdbd','#f7aeae','#f69f9f','#f48f8f','#f28080','#f17070','#ef6060','#ee5151','#ec4242','#eb3434','#ea2727','#e91b1b','#e81010','#e70707','#d80707'];
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
                        // White to red spectrum
                        if (startpoint==undefined) {
                            var startpoint = {};
                            startpoint.r = 255;
                            startpoint.g = 251;
                            startpoint.b = 193;
                        }
                        if (midpoint==undefined) {
                            var midpoint = {};
                            midpoint.r = 255;
                            midpoint.g = 77;
                            midpoint.b = 30;
                        }
                        if (endpoint==undefined) {
                            var endpoint = {};
                            endpoint.r = 230;
                            endpoint.g = 0;
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
                        // White to red spectrum
                        if (startpoint==undefined) {
                            var startpoint = {};
                            startpoint.r = 255;
                            startpoint.g = 255;
                            startpoint.b = 255;
                        }
                        if (endpoint==undefined) {
                            var endpoint = {};
                            endpoint.r = 230;
                            endpoint.g = 0;
                            endpoint.b = 0;
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
            },

            getStandardRange: function(name, layertype) {
                var standard_range;
                if(/B12|B17|B16|B18|B13|B19|B15|B14|bioclim_12|bioclim_17|bioclim_16|bioclim_18|bioclim_13|bioclim_19|bioclim_15|bioclim_14/g.test(name)){
                    standard_range = 'rainfall';
                } else if(/B11|B10|B02|B03|B01|B06|B07|B04|B05|B08|B09|bioclim_11|bioclim_10|bioclim_02|bioclim_03|bioclim_01|bioclim_06|bioclim_07|bioclim_04|bioclim_05|bioclim_08|bioclim_09/g.test(name)){
                    standard_range = 'temperature';
                } else if(layertype == 'continuous') {
                    standard_range = 'probability';
                } else {
                    standard_range = 'soil';
                }
                return standard_range;
            },
            
            generateSLD: function(filename, minVal, maxVal, steps, startpoint, midpoint, endpoint, layertype ) {
                var standard_range;
                if (startpoint || midpoint || endpoint ) {
                    standard_range = "custom";
                } else {
                    standard_range = bccvl_common.getStandardRange(filename, layertype);
                }
                
                var rangeArr = bccvl_common.generateRangeArr(standard_range, minVal, maxVal, steps);
                var colorArr = bccvl_common.generateColorArr(standard_range, steps, startpoint, midpoint, endpoint);
                
                var xmlStylesheet = '<StyledLayerDescriptor version="1.1.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><se:Name>DEFAULT</se:Name><UserStyle><se:Name>xxx</se:Name><se:FeatureTypeStyle><se:Rule><se:RasterSymbolizer><se:Opacity>0.7</se:Opacity><se:ColorMap><se:Categorize fallbackValue="#78c818"><se:LookupValue>Rasterdata</se:LookupValue>';

                for (var i = 0; i < (steps+1); i++) {
                    xmlStylesheet += '<se:Value>'+colorArr[i]+'</se:Value><se:Threshold>'+rangeArr[i]+'</se:Threshold>';
                }
                
                xmlStylesheet += '<se:Value>'+colorArr[colorArr.length-1]+'</se:Value>';
                
                xmlStylesheet += '</se:Categorize></se:ColorMap></se:RasterSymbolizer></se:Rule></se:FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';

                return xmlStylesheet;
            },

            createLegend: function(layer, id, minVal, maxVal, steps, startpoint, midpoint, endpoint) {
                // create a legend for given values
                var standard_range = bccvl_common.getStandardRange(layer.id, layer.type);
                
                // Get hex color range and map values
                var rangeArr = bccvl_common.generateRangeArr(standard_range, minVal, maxVal, steps);
                var colorArr = bccvl_common.generateColorArr(standard_range, steps, startpoint, midpoint, endpoint);
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
                return legend;
            },

            exportAsImage: function(e) {
                var map = e.data.map;
                var mapTitle = e.data.mapTitle;

                var visible = [];

                map.getLayers().forEach(function(lgr) {
                    // assumes that we have only groups on map check that
                    if (lgr instanceof ol.layer.Group) {
                        // iterate over layers within group
                        lgr.getLayers().forEach(function(lyr) {
                            if (lyr.get('type') != 'base' && lyr.getVisible()) {
                                // only look at visible non base layers
                                // collect titles for visible layers
                                visible.push(lyr.get('title'));
                            }
                        });
                    }
                });
                    
                // need to add a map/dataset title here, instead of 'MAP'
                var imageTitle = 'BCCVL -- ' + mapTitle;
                // add visible layers into filename
                imageTitle += ' -- ' + visible.join(", "); 
                // append filename
                $(e.target).attr('download', imageTitle+'.png');
                    
                map.once('postcompose', function(event) {
                    var canvas = event.context.canvas;
                    $(e.target).attr('href', canvas.toDataURL('image/png'));
                });
                map.renderSync();
            },

            roundUpToNearestMagnitude: function(x) {
                // Round x to next order of magnitude
                var y = Math.pow(10, Math.ceil(Math.log10(x))) ;
                // if y is 0 or NaN set it to 1
                if (! y) {
                    y = 1;
                }
                return y;
            },

            // create new OL layer from layer metadata data object
            createLayer: function(uuid, data, layer, title, type, visible, styleObj, legend) {
                // data ... dataset metadata
                // layer ... layer metadata
                // title ... display title
                // type ... 'wms', 'wms-occurrence', ...
                // visible ...
                // legend ... a dom node to use as legend
                var wms_params = {
                    "layers": "DEFAULT",
                    "transparent": "true",
                    "format": "image/png"
                };
                if (type != "wms-occurrence") {
                    wms_params['SLD_BODY'] = bccvl_common.generateSLD(layer.layer || layer.filename, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint, layer.datatype);
                }
                if (data.mimetype == "application/zip") {
                    wms_params['DATA_URL'] = data.vizurl + ('filename' in layer ? '#' + layer.filename : '');  // The data_url the user specified
                } else {
                    wms_params['DATA_URL'] = data.vizurl;  // The data_url the user specified
                }
                
                var newLayer = new ol.layer.Tile({
                    // OL3 layer attributes
                    visible: visible,
                    preload: 10,
                    source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                        url: visualiserWMS,
                        params: wms_params
                    })),
                    // layer switcher attributes
                    title: title,
                    type: type, // 'base', 'wms', 'wms-occurrence', 'layers'?
                    // custom data on OL layer object
                    uuid: uuid,
                    bccvl: { 
                        data: data,
                        layer: layer, // layer metadata
                        legend: legend
                    }
                });
                return newLayer;
            }

        };
        return bccvl_common;
    }
);
