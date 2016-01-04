
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-progress-bar'],
   function( $, layout, ol, layerswitcher, progress_bar ) {

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
            // 260815: No longer in use, kept for possible future use.
            /*commonAjaxSetup: function(){
                $.ajaxSetup({
                    timeout: 20000,
                    error: function(jqXHR, textStatus, errorThrown){
                        console.log('Error on map: '+textStatus);
                        if (textStatus ==  'timeout'){
                            console.log("The request timed out. This can happen for a number of reasons, please try again later.  If the issue persists, contact our support staff via bccvl.org.au.");
                        }
                    }
                });
                
            },*/

            generateRangeArr: function(styleObj){
                var standard_range = styleObj.standard_range;
                var minVal = styleObj.minVal;
                var maxVal = styleObj.maxVal;
                var steps = styleObj.steps;
                
                if (standard_range == 'rainfall'){
                    // rainfall BOM standard range
                    var rangeArr = [0,200,300,400,500,600,800,1000,1200,1600,2000,2400,3200];
                } else if (standard_range == 'temperature') {
                    // temperature BOM standard range
                    var rangeArr = [-3,0,3,6,9,12,15,18,21,24,27,30,33,36,39];
                } else if (standard_range == 'suitability' && maxVal <= 1000) {
                    
                    if (maxVal <= 1){
                        var rangeArr = [0,0.05,0.10,0.15,0.20,0.25,0.30,0.35,0.40,0.45,0.50,0.55,0.60,0.65,0.70,0.75,0.80,0.85,0.90,0.95,1.00];
                    } else if (maxVal <= 10){
                        var rangeArr = [0,0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,7.5,8.0,8.5,9.0,9.5,10];
                    } else if (maxVal <= 100){
                        var rangeArr = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
                    } else if (maxVal <= 1000){
                        var rangeArr = [0,50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850,900,950,1000];
                    }
                    
                } else if (standard_range == 'occurrence' ||  standard_range == 'absence') {
                    var rangeArr = [1];
                } else if (standard_range == 'categorical') { 
                    var rangeArr = [];
                    for (var i = 1; i < (steps+1); i++) {
                        rangeArr.push(i);
                    }
                } else {
                    // dummy max and min values, eventually replaced with relative-to-layer values
                    if (minVal==undefined) minVal = 0;
                    if (maxVal==undefined) maxVal = 215;
                    if (steps==undefined) steps = 20; // must be even number for 3 color phase to work
                    
                    var rangeInt = (maxVal - minVal)/steps;
                    var rangeArr = [];
                    for (var i = 0; i < (steps+1); i++) {
                        rangeArr.push(minVal + rangeInt*i);
                    }
                }
                return rangeArr;
            },

            numPrec: function(num, prec) {
                return (num.toFixed(prec) * 1).toString();
            },

            genColor: function(seed) {
                color = Math.floor((Math.abs(Math.sin(seed) * 12233456)) % 12233456);
                color = color.toString(16);
                // pad any colors shorter than 6 characters with leading 0s
                while(color.length < 6) {
                    color = '0' + color;
                }
                
                return color;
            },

            generateColorArr: function(styleObj) {

                /*  Generate array of hexidecimal colour values, note the extra value on top of threshold range. */
                var standard_range = styleObj.standard_range;
                var startpoint = styleObj.startpoint;
                var midpoint = styleObj.midpoint;
                var endpoint = styleObj.endpoint;
                var steps = styleObj.steps;
                if (standard_range == 'rainfall'){
                    // rainfall BOM standard colours
                    var colorArr = ['#FFFFFF','#fffee8','#fefdd1','#f6f8ab','#daeca2','#c1e3a3','#a8dba4','#8cd1a4','#6fc9a5','#45c1a4','#00b4a5','#00999a','#017b7d','#005b5c'];
                } else if (standard_range == 'temperature') {
                    // temperature BOM standard colours
                    var colorArr = ['#13a7ce','#0eb9d2','#54c5d2','#87d2d1','#b1e0d3','#c6e6d3','#d8eed4','#ecf6d5','#fefed7','#fef5bd','#fdea9b','#fcd78b','#fdc775','#f8a95b','#f58e41','#f3713e'];
                } else if (standard_range == 'suitability' && startpoint == null) {
                    // apply standard suitability coloring only if we don't have a color range set up
                    // FIXME: generate default color range for suitabilities automatically as we do below if possible
                    // basic prob spectrum
                    var colorArr = ['#FFFFFF','#fef8f8','#fdefef','#fce4e4','#fbd8d8','#facbcb','#f9bdbd','#f7aeae','#f69f9f','#f48f8f','#f28080','#f17070','#ef6060','#ee5151','#ec4242','#eb3434','#ea2727','#e91b1b','#e81010','#e70707','#d80707'];
                } else if (standard_range == 'categorical') {
                    var colorArr = [];
                    for (var i = 0; i < (steps+1); i++) {
                        colorArr.push('#'+bccvl_common.genColor(i+1));
                    }
                } else if (standard_range == 'occurrence') {
                    var colorArr = ['#e74c3c'];
                } else if (standard_range == 'absence') {
                    var colorArr = ['#3498db'];
                
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

            getStandardRange: function(layerdef) {
                var standard_range;
                if ($.inArray(layerdef.legend, ['rainfall', 'temperature', 'suitability']) > -1) {
                    return layerdef.legend;
                } else if(typeof layerdef.legend === 'undefined') {
                    if (layerdef.datatype == 'continuous') {
                        // undefined layer, and continiuous
                        standard_range = 'suitability';
                    } else {
                        // TODO: categorical data types should not use range, but represent each value as single color
                        standard_range = 'soil';
                    }
                } else {
                    // it's nothing of the above but a defined layer ... so don't use suitability
                    standard_range = 'default';
                } 
                return standard_range;
            },
            
            //generateSLD: function(filename, minVal, maxVal, steps, startpoint, midpoint, endpoint, layertype, layerstyle ) {
            generateSLD: function(layerdef) {
                var xmlStylesheet;
                if (layerdef.type == 'occurrence' || layerdef.type == 'absence') {
                    xmlStylesheet = '<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"><NamedLayer><Name>DEFAULT</Name><UserStyle><Title></Title><FeatureTypeStyle><Rule><PointSymbolizer><Graphic>';
                    xmlStylesheet += '<Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">'+layerdef.style.color+'</CssParameter></Fill></Mark><Size>6</Size>';
                    xmlStylesheet += '</Graphic></PointSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';
                } else {
                    xmlStylesheet = '<StyledLayerDescriptor version="1.1.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><se:Name>DEFAULT</se:Name><UserStyle><se:Name>xxx</se:Name><se:FeatureTypeStyle><se:Rule><se:RasterSymbolizer><se:Opacity>0.9</se:Opacity><se:ColorMap><se:Categorize fallbackValue="#78c818"><se:LookupValue>Rasterdata</se:LookupValue>';
                    var rangeArr = bccvl_common.generateRangeArr(layerdef.style);
	                var colorArr = bccvl_common.generateColorArr(layerdef.style);
	                var steps = layerdef.style.steps;                    
                    // colour range for temperature needs to extend indefinitely negatively and positively.
                    if (layerdef.style.standard_range == 'temperature') {
                        for (var i = 0; i < (colorArr.length-1); i++) {
                            xmlStylesheet += '<se:Value>'+colorArr[i]+'</se:Value><se:Threshold>'+rangeArr[i]+'</se:Threshold>';
                        }
                        xmlStylesheet += '<se:Value>'+colorArr[colorArr.length-1]+'</se:Value>';
                    } else {
                        for (var i = 0; i < (colorArr.length-1); i++) {
                            xmlStylesheet += '<se:Threshold>'+rangeArr[i]+'</se:Threshold><se:Value>'+colorArr[i]+'</se:Value>';
                        }
                    }
                    xmlStylesheet += '</se:Categorize></se:ColorMap></se:RasterSymbolizer></se:Rule></se:FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';
                }
                return xmlStylesheet;
            },

            createStyleObj: function(layerdef, uuid) {
                var styleObj;
                var style = $.Deferred();
                
                if (layerdef.legend == 'categories') {

                    $.ajax({
                        url: portal_url + '/dm/getRAT',
                        method: 'GET',
                        datatype: 'json',
                        data: {'datasetid': uuid, 'layer': layerdef.token},
                        success: function(data, status, jqXHR){

                            var numRows = data.rows.length;
                            var labels = [];

                            $.each( data.rows, function(i, row){
                                //labels.push([]);
                                var label = ''+(i+1)+':';

                                $.each( data.cols, function(idx, col){
                                    if (col.type == 'String' && (col.usage == 'Generic' || col.usage == 'Name')){
                                        label = label + ' ' + row[idx];
                                    }
                                });

                                labels.push(label);

                            });

                            layerdef.labels = labels;                                   

                            // categorial styleobj
                            styleObj = {
                                minVal: 1,
                                maxVal: numRows,
                                steps: numRows,
                                startpoint: {},
                                midpoint: {},
                                endpoint: {}
                            };

                            styleObj.standard_range = 'categorical';

                            style.resolve(styleObj, layerdef);
                        }
                    });

                    return style;

                } else if (layerdef.legend == 'binary'){

                    styleObj = {
                        minVal: 0, 
                        maxVal: 1,
                        steps: 1,
                        startpoint: null,
                        midpoint: null,
                        endpoint: null
                    };

                    styleObj.standard_range = 'binary';

                    style.resolve(styleObj, layerdef);

                    return style;

                } else if (layerdef.legend == 'discrete'){

                    styleObj = {
                        minVal: layerdef.min,
                        maxVal: layerdef.max,
                        steps: 20,
                        startpoint: {r:255,g:255,b:255},
                        midpoint: {r:113,g:183,b:242},
                        endpoint: {r:0,g:133,b:244}
                    };

                    styleObj.standard_range = 'discrete';

                    style.resolve(styleObj, layerdef);

                    return style;

                }  else {
                    var standard_range = bccvl_common.getStandardRange(layerdef);
                    if (standard_range == 'suitability'){
                        // suitability uses different styleObj (0..1 without midpoint) and adjusted max for 0..1 ; 0..1000 range
                        var max = bccvl_common.roundUpToNearestMagnitude(layerdef.max);
                        styleObj = {
                            minVal: 0, // TODO: mahal has negative min value?
                            maxVal: max,
                            steps: 20,
                            startpoint: null,
                            midpoint: null,
                            endpoint: null
                        };
                    } else if (standard_range == 'default') {
                        // standard raster
                        styleObj = {
                            minVal: layerdef.min,
                            maxVal: layerdef.max,
                            steps: 20,
                            startpoint: {r:255,g:255,b:255},
                            midpoint: {r:231,g:76,b:60},
                            endpoint: {r:192,g:57,b:43}
                        };
                    } else {
                        // a predefined color scheme
                        styleObj = {
                            minVal: 0, // TODO: mahal has negative min value?
                            maxVal: layerdef.max,
                            steps: 20,
                            startpoint: null,
                            midpoint: null,
                            endpoint: null
                        };
                    } 
                    styleObj.standard_range = standard_range;
                    
                    style.resolve(styleObj, layerdef);

                    return style;
                }
                
            },

            createLegend: function(layerdef) {
                // create a legend for given values
                
                // Get hex color range and map values
                var rangeArr = bccvl_common.generateRangeArr(layerdef.style);
                var colorArr = bccvl_common.generateColorArr(layerdef.style);
                var standard_range = layerdef.style.standard_range;
                var steps = layerdef.style.steps;
                // determine step size for legend
                var legend_step_size = 5;
                if (standard_range == 'suitability') {
                    legend_step_size = 2;
                } else if ($.inArray(standard_range, ['rainfall', 'temperature', 'categorical', 'binary']) > -1) {
                    legend_step_size = 1;
                }
                // Build legend obj
                var legend = document.createElement('div');
                legend.className = 'olLegend ol-unselectable ol-control shown';

                var button = document.createElement('a');
                button.className = 'ol-button open';
                button.innerHTML = '<i class="fa fa-list-ul"></i>';
                
                var panel = document.createElement('div');
                panel.className = 'panel shown';

                button.onclick = function(e) {
                    e.stopPropagation();
                    if ( panel.className.indexOf('shown') > 0){
                        button.className = 'ol-button'
                        panel.className = 'panel';
                        legend.className = 'olLegend ol-unselectable ol-control';
                    } else {
                        button.className = 'ol-button open'
                        panel.className = 'panel shown';
                        legend.className = 'olLegend ol-unselectable ol-control shown';
                    }
                };
                
                if (layerdef.tooltip && layerdef.tooltip.length > 0) {
                    var popover = '<span class="fa fa-info-circle popover-toggle" data-toggle="popover" data-container="body" data-trigger="hover" data-placement="right" title="' + layerdef.unitfull + '" data-content="' + layerdef.tooltip + '">&nbsp;</span>';
                    panel.innerHTML += '<h5>' + layerdef.unit + ' '+popover+'</h5>';
                } else {
                    if (standard_range == 'binary') {
                        panel.innerHTML += '<h5>Occurrence</h5>';
                    } else if (standard_range == 'discrete') {
                        panel.innerHTML += '<h5>Mask</h5>';
                    } else if (standard_range == 'suitability') {
                        panel.innerHTML += '<h5>Suitability</h5>';
                    } else {
                        panel.innerHTML += '<h5>' + layerdef.unit + '</h5>';                        
                    }
                }

                for (var i = 0; i < (rangeArr.length); i = i+legend_step_size) {
                    if (standard_range == 'categorical'){
                        panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>'+layerdef.labels[i]+'</label>';
                    } else if (standard_range == 'binary'){
                        if (rangeArr[i] != 0){
                            panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>True</label>';
                        }
                        
                    } else {
                        if (i == (rangeArr.length-1)){
                            panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+bccvl_common.numPrec(rangeArr[i], 2)+'&nbsp;+</label>';
                        } else {
                            panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+bccvl_common.numPrec(rangeArr[i], 2)+'&nbsp;-&nbsp;'+bccvl_common.numPrec(rangeArr[i+legend_step_size], 2)+'</label>';
                        }
                    }
                }

                legend.appendChild(button);
                legend.appendChild(panel);

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
            // createLayer: function(uuid, data, layer, title, type, visible, styleObj, legend, style) {
            createLayer: function(id, layerdef, data, type, legend) {

                var uuid = data.id;
                var title = layerdef.title;
                var visible = layerdef.isVisible;
                var styleObj = layerdef.style;
                
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
                //if (type != "wms-occurrence") {
                wms_params['SLD_BODY'] = bccvl_common.generateSLD(layerdef);
                    // wms_params['SLD_BODY'] = bccvl_common.generateSLD(layer.layer || layer.filename, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint, layer.datatype, style);
                //}
                if (data.mimetype == "application/zip") {
                    wms_params['DATA_URL'] = data.file + ('filename' in layerdef ? '#' + layerdef.filename : '');  // The data_url the user specified
                } else {
                    wms_params['DATA_URL'] = data.file;  // The data_url the user specified
                }

                var progress = new progress_bar.Progress_bar(document.getElementById('progress-'+id));

                var source = new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                         url: visualiserWMS,
                         params: wms_params,
                         serverType: 'mapserver'
                }));

                source.on('tileloadstart', function(event) {
                  progress.addLoading();
                });

                source.on('tileloadend', function(event) {
                  progress.addLoaded();
                });
                source.on('tileloaderror', function(event) {
                  progress.addLoaded();
                });
                
                var newLayer = new ol.layer.Tile({
                    // OL3 layer attributes
                    visible: visible,
                    preload: 10,
                    source: source,
                    // layer switcher attributes
                    title: title,
                    type: type, // 'base', 'wms', 'wms-occurrence', 'layers'?
                    // custom data on OL layer object
                    uuid: uuid,
                    bccvl: { 
                        data: data,
                        layer: layerdef, // layer metadata
                        legend: legend
                    }
                });
                
                //if (type != "wms-occurrence") {

                    var setCompositeMode = function(evt) {
                        evt.context.globalCompositeOperation = 'darken';
                    };

                    newLayer.on('precompose', setCompositeMode);
                    newLayer.on('postcompose', function() {
                        newLayer.un('precompose', setCompositeMode);
                    });
                //}

                return newLayer;
            },

            getPointInfo: function(evt){
                // PARAM            REQURIED    DESC
                // Service          Yes         Service name. Value is WMS.
                // version          Yes         Service version. Value is one of 1.0.0, 1.1.0, 1.1.1, 1.3.
                // request          Yes         Operation name. Value is GetFeatureInfo.
                // layers           Yes         See GetMap
                // styles           Yes         See GetMap
                // srs or crs       Yes         See GetMap
                // bbox             Yes         See GetMap
                // width            Yes         See GetMap
                // height           Yes         See GetMap
                // query_layers     Yes         Comma-separated list of one or more layers to query.
                // info_format      No          Format for the feature information response. See below for values.
                // feature_count    No          Maximum number of features to return. Default is 1.
                // x or i           Yes         X ordinate of query point on map, in pixels. 0 is left side. i is the parameter key used in WMS 1.3.0.
                // y or j           Yes         Y ordinate of query point on map, in pixels. 0 is the top. j is the parameter key used in WMS 1.3.0.
                // exceptions       No          Format in which to report exceptions. The default value is application/vnd.ogc.se_xml.
                
                // check for any current requests and kill
                if (get)
                    get.abort();

                // get back to familiar object names.
                var map = evt.map;

                // remove any existing popups or overlays 
                // (this might need to be tightened if we include different types in future)
                map.getOverlays().forEach(function(overlay) {
                    overlay.setPosition(undefined);
                    map.removeOverlay(overlay); 
                });

                var container = $('#'+map.getTarget());

                var popupContainer = $('<div />', { 'class': 'ol-popup' });
                var popupContent = $('<div />', { 'class': 'ol-popup-content' });
                    popupContent.append('<p><em>Requesting data ...</em></p>');
                var popupCloser = $('<a />', { 'class': 'ol-popup-closer', href: '#' });

                    popupContainer.append(popupCloser, popupContent);
                    container.append(popupContainer);

                /**
                 * Add a click handler to hide the popup.
                 * @return {boolean} Don't follow the href.
                 */
                popupCloser.on('click', function() {
                  popup.setPosition(undefined);
                  popupCloser.blur();
                  return false;
                });

                /**
                 * Create an overlay to anchor the popup to the map.
                 */
                var popup = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
                  // have to target the dom node inside the jquery obj
                  element: popupContainer[0],
                  autoPan: true,
                  autoPanAnimation: {
                    duration: 250
                  }
                }));

                // add popup with 'loading' for long requests

                map.addOverlay(popup);

                popup.setPosition(evt.coordinate);
                    
                /**
                 * Get info about map and current view
                 */
                var view = map.getView();
                var viewProj = view.getProjection();
                var layer; 

                map.getLayers().forEach(function(lgr) {
                    // assumes that we have only groups on map check that
                    if (lgr instanceof ol.layer.Group) {
                        // iterate over layers within group
                        lgr.getLayers().forEach(function(lyr) {
                            if (lyr.get('type') != 'base' && lyr.getVisible()) {
                                // only look at visible non base layers
                                // collect titles for visible layers
                                layer = lyr;
                            }
                        });
                    }
                });

                /**
                 * Setup parser to deal with response
                 */
                var parser = new ol.format.WMSGetFeatureInfo();

                /**
                 * Build request
                 */
                var request = layer
                        .getSource()
                        .getGetFeatureInfoUrl(
                            evt.coordinate,
                            evt.map.getView().getResolution(),
                            evt.map.getView().getProjection(),
                            {
                                'INFO_FORMAT': 'application/vnd.ogc.gml',
                                'QUERY_LAYERS': 'DEFAULT'
                            }
                        );

                /**
                 * Perform request, and functions after response
                 */
                var get = $.get(request, function (data) {

                    popupContent.empty();

                    var features = parser.readFeatures(data);

                    var content = [];
                    if(features.length > 0) {

                        $.each(features, function(i, feature){
                            content[i] = feature.getProperties();
                        });

                    } else {
                        content.push({"empty": "No data for this location."});
                    }

                    $.each(content, function(i, obj){
                        // setup location
                        if (obj['lat'] && obj['lon']){
                            // round to reasonable number of decimal places
                            var lat = Math.round((obj['lat']*10000)) / 10000;
                            var lon = Math.round((obj['lon']*10000)) / 10000;
                            obj['location'] = lat+', '+lon;
                        } else if (obj['x'] && obj['y']){
                            // projection pulled from view obj above
                            // split and join for consistency
                            var coords = ol.proj.transform([obj['x'], obj['y']], viewProj.getCode(), 'EPSG:4326');
                            // round to reasonable number of decimal places
                            var lat = Math.round((coords[0]*10000)) / 10000;
                            var lon = Math.round((coords[1]*10000)) / 10000;
                            obj['location'] = lat+', '+lon;
                        }
                        // append location, if it exists
                        if (obj['location']) 
                            popupContent.prepend('<p><strong>Location:</strong> '+obj['location']+'<p>');
                        
                        // append species, if it exists
                        if (obj['species']) 
                            popupContent.append('<p><strong>Species:</strong> '+obj['species']+'</p>');
                        
                        // append value, if it exists
                        if (obj['value_0'])
                            popupContent.append('<p><strong>Value:</strong> '+obj['value_0']+'</p>');

                        // if empty, say 'no data'
                        if (obj['empty'])
                            popupContent.append('<p>'+obj['empty']+'</p>');

                    });

                });

            },

            hoverHandler: function(evt){
                var map = evt.map;
                if (evt.dragging) {
                    return;
                }
                var pixel = map.getEventPixel(evt.originalEvent);
                var hit = map.forEachLayerAtPixel(pixel, function(layer) {
                    return true;
                },
                    this,
                    function(layer) {
                        if (layer.get('type') != 'base') {
                            return true;
                        }
                        return false;
                    }
                );
                map.getTargetElement().style.cursor = hit ? 'pointer' : '';

            },

            
            renderBase: function(id){
                var base = $.Deferred();
                // RENDER EMPTY MAP
                // CREATE BASE MAP
                // -------------------------------------------------------------------------------------------
                var map;

                // Australia Bounds
                var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
                var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
                var australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);

                // NEED TO DESTROY ANY EXISTING MAP
                var container = $('#'+id);
                if (container.hasClass('active')) {
                    container.empty();
                    map = null;
                }

                // destroy any html from images or text files
                container.html('');

                // destroy any floating progress bars (should be destroyed above, this is a fallback)
                $('#progress-'+id).remove();

                var visLayers = new ol.layer.Group({
                    title: 'Layers',
                    layers: []
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
                                })
                                // new ol.layer.Tile({
                                //     title: 'Satellite',
                                //     type: 'base',
                                //     visible: false,
                                //     source: new ol.source.MapQuest({layer: 'sat'})
                                // })
                            ]
                        }),
                        visLayers
                    ],
                    view: new ol.View({
                      center: ol.proj.transform([133, -27], 'EPSG:4326', 'EPSG:3857'),
                      zoom: 4
                    })
                });

                // zoom to Australia
                map.getView().fit(australia_bounds, map.getSize());

                // add fullscreen toggle control
                var fullScreenToggle = new ol.control.FullScreen();
                map.addControl(fullScreenToggle);
                // remove crappy unicode icon so fontawesome can get in
                $('#'+id+' button.ol-full-screen-false').html('');

                // set to active
                container.addClass('active');
                // add progress bar container
                container.find('.ol-viewport .ol-overlaycontainer-stopevent').append('<div id="progress-'+id+'" class="map-progress-bar"></div>');

                // hook up exportAsImage
                $('#'+id+' .ol-viewport').append('<a class="export-map ol-control" download="map.png" href=""><i class="fa fa-save"></i> Image</a>');
                $('#'+id+' a.export-map').click(
                    { map: map,
                      mapTitle: null
                    }, bccvl_common.exportAsImage);

                base.resolve(map, visLayers);

                return base;
            },


            createLegendBox: function(id, title){

                // Build legend obj
                var legend = document.createElement('div');
                legend.className = 'olLegend ol-unselectable ol-control shown';

                var button = document.createElement('a');
                button.className = 'ol-button open';
                button.innerHTML = '<i class="fa fa-list-ul"></i>';
                
                var panel = document.createElement('div');
                if (typeof title !== "undefined"){
                    panel.innerHTML = '<h5>'+title+'</h5>';
                } else {
                    panel.innerHTML = '<h5>Layers</h5>';
                }
                panel.className = 'panel shown';

                button.onclick = function(e) {
                    e.stopPropagation();
                    if ( panel.className.indexOf('shown') > 0) {
                        button.className = 'ol-button';
                        panel.className = 'panel';
                        legend.className = 'olLegend ol-unselectable ol-control';
                    } else {
                        button.className = 'ol-button open';
                        panel.className = 'panel shown';
                        legend.className = 'olLegend ol-unselectable ol-control shown';
                    }
                };

                legend.appendChild(button);
                legend.appendChild(panel);

                $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append(legend);
                    
            },


            addLayerLegend: function(layername, color, uuid, colorName){  
                if (color == 'occurrence'){
                    $('.olLegend .panel').append('<label data-uuid="'+uuid+'" style="padding-top:1px;"><i style="color:red;text-align:center;margin-top:3px;" class="fa fa-circle"></i>&nbsp;'+layername+'</label>');
                } else {
                    if (typeof color == 'string'){
                        $('.olLegend .panel').append('<label data-uuid="'+uuid+'" data-color-name="'+colorName+'"><i style="background:'+color+'"></i>&nbsp;'+layername+'</label>');
                    } else {
                        var colorRGB = 'rgba('+color.r+','+color.g+','+color.b+',1)';
                        $('.olLegend .panel').append('<label data-uuid="'+uuid+'" data-color-name="'+colorName+'"><i style="background:'+colorRGB+'"></i>&nbsp;'+layername+'</label>');
                    }
                }
            },

            drawConstraints: function(el, map, constraintsLayer, field_id){
                // clear loyer
                constraintsLayer.getSource().clear();
                
                var draw;

                var geometryFunction = function(coordinates, geometry) {
                    if (!geometry) {
                      geometry = new ol.geom.Polygon(null);
                    }
                    var start = coordinates[0];
                    var end = coordinates[1];
                    geometry.setCoordinates([
                      [start, [start[0], end[1]], end, [end[0], start[1]], start]
                    ]);
                    return geometry;
                };

                draw = new ol.interaction.Draw({
                    source: constraintsLayer.getSource(),
                    type: /** @type {ol.geom.GeometryType} */ 'LineString',
                    geometryFunction: geometryFunction,
                    maxPoints: 2
                });

                draw.on('drawstart', function(evt){
                    // this isn't being used... yet
                });

                draw.on('drawend', function(evt){

                    evt.feature.setId('geo_constraints');

                    //encode to geoJson and write to textarea input
                    var feature = evt.feature;
                    var format = new ol.format.GeoJSON({
                        defaultDataProjection: 'EPSG:4326'
                    });
                    var data;

                    // FIXME: workaround (should be fixed in R script)
                    //        set dummy property, because R geojson parser doesn't like null for properties
                    // FIXME: OL3 GeoJSON formatter does not set CRS on feature or geometry  :(
                    feature.set('dummy', false);
                    data = format.writeFeature(feature);
                    

                    $('#' + field_id).val('' + data + '');
                    // interaction finished, free up mouse events
                    map.removeInteraction(draw);
                    //map.on('singleclick', bccvl_common.getPointInfo)
                });

                map.addInteraction(draw);
            },

            inputConstraints: function(el, map, coords, constraintsLayer, field_id){

                // clear layer
                constraintsLayer.getSource().clear();

                var mapProj = map.getView().getProjection().getCode();

                var bounds = [
                   [coords.west, coords.north], 
                   [coords.east, coords.north], 
                   [coords.east, coords.south], 
                   [coords.west, coords.south],
                   [coords.west, coords.north]
                ];

                var polygon = new ol.geom.Polygon([bounds]);

                polygon.transform('EPSG:4326', mapProj);

                var feature = new ol.Feature({
                    geometry: polygon
                });

                feature.setId('geo_constraints');

                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                      color: 'rgba(0, 160, 228, 0.1)'
                    }),
                    stroke: new ol.style.Stroke({
                      color: 'rgba(0, 160, 228, 0.9)',
                      width: 2
                    })
                });

                feature.setStyle(style);

                constraintsLayer.getSource().addFeature(feature);

                // is this recreating the vector layer each time?

                var format = new ol.format.GeoJSON();
                var data = format.writeFeature(feature);

                $('#'+field_id).val(''+data+'');

            },

            removeConstraints: function(el, map, constraintsLayer, field_id){
                // clear vector source
                constraintsLayer.getSource().clear();

                $('#' + field_id).val('');
            },

            constraintTools: function(map, constraintsLayer, field_id){
                $('.btn.draw-polygon').on('click', function(){
                    //map.un('singleclick', bccvl_common.getPointInfo);
                    bccvl_common.drawConstraints($(this), map, constraintsLayer, field_id);
                });
                $('.btn.input-polygon').on('click',  function(){
                    var coords = {};
                    coords.north = parseFloat($('#north-bounds').val());
                    coords.east = parseFloat($('#east-bounds').val());
                    coords.south = parseFloat($('#south-bounds').val());
                    coords.west = parseFloat($('#west-bounds').val());

                    bccvl_common.inputConstraints($(this), map, coords, constraintsLayer, field_id);
                });
                $('.btn.remove-polygon').on('click', function(){
                    bccvl_common.removeConstraints($(this), map, constraintsLayer, field_id);
                });
                constraintsLayer.getSource().on(['addfeature', 'removefeature', 'changefeature'], function(evt) {
                    if (evt.type == 'removefeature') {
                        $('#north-bounds').val('');
                        $('#east-bounds').val('');
                        $('#south-bounds').val('');
                        $('#west-bounds').val('');
                    } else {
                        var geom = evt.feature.getGeometry();
                        var ext = geom.getExtent();
                        var mapProj = map.getView().getProjection().getCode();
                        var transfn = ol.proj.getTransform(mapProj, 'EPSG:4326');
                        var newext = ol.extent.applyTransform(ext, transfn);
                        $('#north-bounds').val(newext[3].toFixed(6));
                        $('#east-bounds').val(newext[2].toFixed(6));
                        $('#south-bounds').val(newext[1].toFixed(6));
                        $('#west-bounds').val(newext[0].toFixed(6));
                    }
                });
            },

            drawBBoxes: function(map, geometries, bboxLayer) {

                // clear any existing features
                bboxLayer.getSource().clear();
                
                geometries.forEach(function(geometry) {

                    bccvl_common.addLayerLegend('Climate/Env. Dataset', 'rgba(46, 204, 113, 0.9)', null, null);

                    var mapProj = map.getView().getProjection().getCode();

                    // sanity check for worldclim
                    var max4326 = ol.proj.get('EPSG:4326').getExtent();

                    geometry.top = Math.min(geometry.top, max4326[3]);
                    geometry.right = Math.min(geometry.right, max4326[2]);
                    geometry.bottom = Math.max(geometry.bottom, max4326[1]);
                    geometry.left = Math.max(geometry.left, max4326[0]);

                    var bounds = [
                       [geometry.left, geometry.top], 
                       [geometry.right, geometry.top], 
                       [geometry.right, geometry.bottom], 
                       [geometry.left, geometry.bottom],
                       [geometry.left, geometry.top]
                    ];

                    var polygon = new ol.geom.Polygon([bounds]);

                    polygon.transform('EPSG:4326', mapProj);

                    var feature = new ol.Feature({
                        geometry: polygon
                    });

                    var style = new ol.style.Style({
                        fill: new ol.style.Fill({
                          color: 'rgba(46, 204, 113, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                          color: 'rgba(46, 204, 113, 0.9)',
                          width: 2
                        })
                    });
                    feature.setStyle(style);

                    bboxLayer.getSource().addFeature(feature);

                    /**/
                });

            }


        };
        return bccvl_common;
    }
);











