
// JS code to initialise the visualiser map

// PROJ4 needs to be loaded after OL3
define(['jquery', 'bccvl-preview-layout', 'openlayers3', 'proj4', 'ol3-layerswitcher', 'bccvl-visualiser-progress-bar'],
    function( $, layout, ol, proj4, layerswitcher, progress_bar) {

        require(['raven'], function(Raven) {
            Raven.config('https://7ed3243e68b84bbfa3530b112dbd21e2@sentry.bccvl.org.au/2', {
                whitelistUrls: [ '\.bccvl\.org\.au/']
            }).install()
            
            $(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
                Raven.captureException(new Error(thrownError || jqXHR.statusText), {
                    extra: {
                        type: ajaxSettings.type,
                        url: ajaxSettings.url,
                        data: ajaxSettings.data,
                        status: jqXHR.status,
                        error: thrownError || jqXHR.statusText,
                        response: jqXHR.responseText.substring(0, 100)
                    }
                });
            });
        });

       // define some projections we need
       proj4.defs([
           // alternatively load http://epsg.io/4283.js
           ['EPSG:4283','+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'],
           // alternatively load http://epsg.io/3577.js
           //                    http://epsg.io/3577.wkt
           //                    http://epsg.io/3577.proj4
           ['EPSG:3577', '+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=132 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs']
       ]);

       // tell ol3 about the projections
       var proj4283 = proj4('EPSG:4283');
       ol.proj.addProjection(new ol.proj.Projection({
           code: 'EPSG:4283',
           units: 'degrees ',
           axisOrientation: proj4283.oProj.axis,
           // extent is needed for ol3 to determine zoom levels
           extent: [93.41, -60.56, 173.4, -8.47]
       }));
       // define transform methods from and to map projection
       var proj4283Transform = proj4('EPSG:4283', 'EPSG:3857');
       ol.proj.addCoordinateTransforms('EPSG:4283', 'EPSG:3857',
                                       proj4283Transform.forward,
                                       proj4283Transform.inverse);       
       // same for EPSG:3577
       var proj3577 = proj4('EPSG:3577');
       ol.proj.addProjection(new ol.proj.Projection({
           code: 'EPSG:3577',
           units: 'm',
           axisOrientation: proj3577.oProj.axis,
           // extent is needed for ol3 to determine zoom levels
           extent: [-1594494.51, -4894565.95, 2436270.29, -1240480.01]
       }));
       // define transform methods from and to map projection
       var proj3577Transform = proj4('EPSG:3577', 'EPSG:3857');
       ol.proj.addCoordinateTransforms('EPSG:3577', 'EPSG:3857',
                                       proj3577Transform.forward,
                                       proj3577Transform.inverse);       

       // visualiser base url
       var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
       var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';

       // dataset manager getMetadata endpoint url
       var dmurl = portal_url + '/dm/getMetadata';

       var layer_vocab = {};
       // FIXME: is there a  race condition possible here?
       //        e.g. layer_vocab is required before it is populated?
       $.getJSON(portal_url + "/dm/getVocabulary", {name: 'layer_source'}, function(data, status, xhr) {
           $.each(data, function(index, value) {
               layer_vocab[value.token] = value;
           });
       });

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

            mapRender: function(uuid, url, id, type, visibleLayer) {

              var ready = $.Deferred();

              // CREATE BASE MAP
              // -------------------------------------------------------------------------------------------
              // TODO: wrapping in when not necessary?
              $.when(bccvl_common.renderBase(id)).then(function(map, visLayers) {

                  // add layerswitcher
                  var layerSwitcher = new ol.control.LayerSwitcher({
                      toggleOpen: true,
                      singleVisibleOverlay: true
                  });
                  // add scaleline
                  var scaleline = new ol.control.ScaleLine({
                      className: 'ol-scale-line'
                  });

                  map.addControl(layerSwitcher);
                  map.addControl(scaleline);
                  layerSwitcher.showPanel();

                  var layerListeners = []

                  // register a listener on visLayers list to bind/unbind based on list change (whenever a new layer is added)
                  visLayers.getLayers().on('propertychange', function(e, layer){

                    // Clean up layer change listeners
                    for (var i = 0, key; i < layerListeners.length; i++) {
                        binding = layerListeners[i];
                        binding[0].unByKey(binding[1]);
                    }
                    layerListeners.length = 0;

                    visLayers.getLayers().forEach(function(layer) {
                          // if layer is visible we have to show legend as well
                          if (layer.getVisible()) {
                              $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append(layer.get('bccvl').legend);
                              // zoom to extent to first visible layer
                              if(layer.getExtent()){
                                  map.getView().fit(layer.getExtent(), map.getSize());
                              }
                          }

                          layer.on('change:visible', function(e) {
                              if (layer.getVisible()){
                                  var bccvl = layer.get('bccvl');
                                  // remove existing legend
                                  $('.olLegend').remove();
                                  // add new legend to dom tree
                                  $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append(bccvl.legend);
                              }
                          }); 
                    });

                  });
  
                  // load and add layers to map
                  bccvl_common.addLayersForDataset(uuid, id, visibleLayer, visLayers);
                  
                  // add click control for point return
                  map.on('singleclick', function(evt){
                      bccvl_common.getPointInfo(evt);
                  });
                  
                  map.on('pointermove', function(evt) {
                      bccvl_common.hoverHandler(evt);
                  });

                  ready.resolve(map, visLayers);
                  
              });

              return ready;

           },

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
                   var rangeArr = [-6,-3,0,3,6,9,12,15,18,21,24,27,30,33,36,39,42,45];
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
                   // rangeArr =           [-6,        -3,       0,         3,        6,         9,        12,       15,       18,       21,      24,       27,       30,       33,       36,        39,       42,     45];
                   var colorArr = ['#990099','#fe00fe','#ffb4ff','#cccccc','#6767fe','#33ccff','#99fefe','#00cc00','#67ff67','#ccfecc','#fefecc','#ffff34','#ffcc66','#ffcccc','#ff9999','#ff3333','#cc0000','#895b2e', '#993300'];
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
                   xmlStylesheet += '<Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">'+layerdef.style.color+'</CssParameter></Fill></Mark><Size>4</Size>';
                   xmlStylesheet += '</Graphic></PointSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';
               } else {
                   layername = "DEFAULT";
                   if (layerdef.dblayer) {
                       layername = layerdef.dblayer;
                   }
                   xmlStylesheet = '<StyledLayerDescriptor version="1.1.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><se:Name>' + layername + '</se:Name><UserStyle><se:Name>xxx</se:Name><se:FeatureTypeStyle><se:Rule><se:RasterSymbolizer><se:Opacity>0.9</se:Opacity><se:ColorMap><se:Categorize fallbackValue="#78c818"><se:LookupValue>Rasterdata</se:LookupValue>';
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
                           xmlStylesheet += '<se:Value>'+colorArr[i]+'</se:Value><se:Threshold>'+rangeArr[i]+'</se:Threshold>';
                       }
                       xmlStylesheet += '<se:Value>'+colorArr[colorArr.length-1]+'</se:Value>';
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
                       button.className = 'ol-button';
                       panel.className = 'panel';
                       legend.className = 'olLegend ol-unselectable ol-control';
                   } else {
                       button.className = 'ol-button open';
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
                       } else if (i == 0) {
                           panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;&lt;'+bccvl_common.numPrec(rangeArr[i], 2)+'&nbsp;-&nbsp;'+bccvl_common.numPrec(rangeArr[i+legend_step_size], 2)+'</label>';
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
               if (typeof layerdef.bounds != 'undefined' && typeof layerdef.projection != 'undefined') {
                   var bounds = [ 
                       layerdef.bounds.left,
                       layerdef.bounds.bottom,
                       layerdef.bounds.right,
                       layerdef.bounds.top
                   ];
                   var proj = layerdef.projection;
               }
               
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

               // Update layers with layer's full name. Save it for referencing the layer.
               layerdef.dblayer = "";
               if (!$.isEmptyObject(data.dblayers)) {
                   var lyr = data.dblayers[layerdef.filename]
                   if (!$.isEmptyObject(lyr)) {
                       wms_params["layers"] = lyr['name'];
                       layerdef.dblayer = lyr['name'];
                   }
               }

               // Add forignKey 
               if (data.foreignKey) {
                   wms_params["foreignKey"] = data.foreignKey;
               }
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
                   preload: 2,
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

               if (bounds && proj){
                   var extent = bccvl_common.transformExtent(bounds, proj, 'EPSG:3857');
                   newLayer.setExtent(extent);
               }
               
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
               var hit = map.forEachLayerAtPixel(pixel,
                                                 function(layer) {
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

               var baseLayers = new ol.layer.Group({
                    title: 'Base Maps',
                    layers: [
                        new ol.layer.Tile({
                          title: 'Mapbox',
                          type: 'base',
                          visible: false,
                          source: new ol.source.XYZ({
                            tileSize: [512, 512],
                            url: 'https://api.mapbox.com/styles/v1/wolskis/ciqip8d3o0006bfnjnff9rt4j/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sc2tpcyIsImEiOiJPTkFISlRnIn0.4Y5-Om3FJ8Ygq11_FafiSw'
                          })
                        }),
                        new ol.layer.Tile({
                           title: 'OSM',
                           type: 'base',
                           preload: 5,
                           visible: true,
                           source: new ol.source.OSM()
                        })
                        /*,
                        new ol.layer.Tile({
                          title: 'Mapbox',
                          type: 'base',
                          source: new ol.source.XYZ({
                            tileSize: [512, 512],
                            url: 'https://api.mapbox.com/styles/v1/wolskis/cip6egiog000hbbm08tcz5e3n/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid29sc2tpcyIsImEiOiJPTkFISlRnIn0.4Y5-Om3FJ8Ygq11_FafiSw'
                          })
                        })*/
                    ]

               });        

               baseLayers.getLayers().forEach(function(lyr) {
                      if (lyr.get('title') == 'Mapbox'){
                        lyr.on('precompose', function(evt){
                          evt.context.globalCompositeOperation = 'lighten';
                        });
                      } else {
                        lyr.on('precompose', function(evt){
                          evt.context.globalCompositeOperation = 'darken';
                        });
                      }
               });            
                    
               map = new ol.Map({
                   target: id,
                   layers: [
                       baseLayers,
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


           addLayersForDataset: function(uuid, id, visibleLayer, visLayers) {
               // styObj ... override given certain styleObj parameters
               var dfrd = $.Deferred();
               var jqxhr = $.xmlrpc({
                   url: dmurl,
                   params: {'datasetid': uuid}});
               jqxhr.then(function(data, status, jqXHR) {
                   // xmlrpc returns an array of results
                   data = data[0];
                   // define local variables
                   var layerdef;
                        
                   // check for layers metadata, if none exists then the request is returning a data like a csv file
                   // TODO: alternative check data.mimetype == 'text/csv' or data.genre
                   //       or use type passed in as parameter
                   if ($.isEmptyObject(data.layers) || data.genre == "DataGenreSpeciesOccurrence" || data.genre == "DataGenreSpeciesAbsence") {
                       // species data  (not a raster)
                       // TODO: use data.title (needs to be populated)
                       layerdef = {
                           'title': data.title || data.description || 'Data Overlay',
                           'bounds': data.bounds,
                           'projection': data.srs || 'EPSG:4326'
                       };


                       if (!$.isEmptyObject(data.layers)) {
                         $.each( data.layers, function(layerid, layer) {
                            layerdef.filename = layer.filename;
                            if (layer.bounds) {
                              layerdef.bounds = layer.bounds;
                            }
                         });
                       }

                        
                       if (data.genre == "DataGenreSpeciesOccurrence" ||
                           data.genre == "DataGenreSpeciesCollection") {
                           layerdef.type = 'occurrence';
                           layerdef.style = {
                               color: '#e74c3c'
                           };
                       } else if (data.genre == "DataGenreSpeciesAbsence") {
                           layerdef.type = 'absence';
                           layerdef.style = {
                               color: '#3498db'
                           };
                       } 
                        
                       // there is no legend for csv data
                       var newLayer = bccvl_common.createLayer(id, layerdef, data, 'wms-occurrence');
                       // add layer to layers group
                       visLayers.getLayers().push(newLayer);
                       dfrd.resolve([newLayer]);

                   } else {
                       // raster data
                       // TODO: data.layer could be standard array, as layerid is in layer object as well
                       var newLayers = [];
                       $.each( data.layers, function(layerid, layer){
                           // get layer definition from vocab
                           layerdef = layer_vocab[layer.layer];
                           if (typeof layerdef === 'undefined') {
                               // We don't have a layerdef so let's create a default fallback
                               // TODO: this may happen in case of experiment outputs (i.e. probability maps) ... they don't have a layer identifier, but a file name
                               // FIXME: how do I know if it is a probability map or just some undefined layer?
                               layerdef = {
                                   'token': layer.layer,
                                   'title': layer.layer || layer.filename,
                                   'unitfull': '',
                                   'unit': '',
                                   'type': '',  // unused
                                   'legend': 'default',
                                   'tooltip': '',
                                   'filename': layer.filename
                               };
                               if (data.genre == 'DataGenreCP' || data.genre == 'DataGenreFP') {
                                   layerdef.legend = 'suitability';
                                   layerdef.unit = ' ';
                                   layerdef.unitfull = 'Environmental suitability';
                                   layerdef.tooltip = 'This value describes the environmental suitability of a species presence in a given location.';
                               }
                           } else {
                               // make a copy of the original object
                               layerdef = $.extend({}, layerdef);
                               // for zip files we need the filename associated with the layer
                               if (layer.filename) {
                                   layerdef.filename = layer.filename;
                               }
                           }
                           layerdef.bounds = layer.bounds;
                           layerdef.projection = layer.srs || 'EPSG:4326';
                           // copy datatype into layer def object
                           layerdef.datatype = layer.datatype;
                           // add min / max values
                           // FIXME: this should go away but some datasets return strings instead of numbers
                           layerdef.min = Number(layer.min);
                           layerdef.max = Number(layer.max);
                           // DETERMINE VISIBILITY, IF LAYER IS NOMINATED - RENDER IT, IF NOT - DEFAULT TO FIRST
                           // if visibleLayer is undefined set first layer visible
                           if (typeof visibleLayer == 'undefined') {
                               visibleLayer = layer.filename;
                           }
                           layerdef.isVisible = layer.filename == visibleLayer;
                           
                           $.when( bccvl_common.createStyleObj(layerdef, uuid) ).then(function(styleObj, layerdef){
                               // object to hold legend and color ranges
                               layerdef.style = styleObj;
                                
                               // create legend for this layer
                               var legend = bccvl_common.createLegend(layerdef);
                                
                               // create layer
                               var newLayer = bccvl_common.createLayer(id, layerdef, data, 'wms', legend);
                               // REMOVE: (uuid, data, layer, layerdef.title, 'wms', layerdef.isVisible, styleObj, legend, layerdef.legend);
                               // add new layer to layer group
                                
                               visLayers.getLayers().push(newLayer);
                               newLayers.push(newLayer);
                           });
                           
                       });
                       dfrd.resolve(newLayers);
                   }
                   
               });
               return dfrd;
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


           addLayerLegend: function(mapid, layername, color, uuid, colorName){
               // find legend box
               var $legend = $('#' + mapid + ' .olLegend .panel');
               if (color == 'occurrence'){
                   $legend.append('<label data-uuid="'+uuid+'" style="padding-top:1px;"><i style="color:red;text-align:center;margin-top:3px;" class="fa fa-circle"></i>&nbsp;'+layername+'</label>');
               } else {
                   if (typeof color == 'string'){
                       $legend.append('<label data-uuid="'+uuid+'" data-color-name="'+colorName+'"><i style="background:'+color+'"></i>&nbsp;'+layername+'</label>');
                   } else {
                       var colorRGB = 'rgba('+color.r+','+color.g+','+color.b+',1)';
                       $legend.append('<label data-uuid="'+uuid+'" data-color-name="'+colorName+'"><i style="background:'+colorRGB+'"></i>&nbsp;'+layername+'</label>');
                   }
               }
           },

           drawConstraints: function(el, map, constraintsLayer) {
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
                   // interaction finished, free up mouse events
                   map.removeInteraction(draw);
                   //map.on('singleclick', bccvl_common.getPointInfo)
               });

               map.addInteraction(draw);
           },

           inputConstraints: function(el, map, coords, constraintsLayer){

               // clear layer
               constraintsLayer.getSource().clear();

               var bounds = [
                   [coords.west, coords.north], 
                   [coords.east, coords.north], 
                   [coords.east, coords.south], 
                   [coords.west, coords.south],
                   [coords.west, coords.north]
               ];

               var polygon = new ol.geom.Polygon([bounds]);
               var mapProj = map.getView().getProjection().getCode();
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

           },

           renderGeojsonConstraints: function(el, map, geojsonObject, constraintsLayer){

               // clear layer
               constraintsLayer.getSource().clear();

               var feature = (new ol.format.GeoJSON()).readFeature(geojsonObject);

               feature.getGeometry().transform('EPSG:4326',map.getView().getProjection());

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

               map.getView().fit(feature.getGeometry().getExtent(), map.getSize(), {padding: [50,50,50,50]});
           },

           removeConstraints: function(el, map, constraintsLayer) {
               // clear vector source
               constraintsLayer.getSource().clear();
           },

           constraintTools: function(map, constraintsLayer, field_id) {
               $('.btn.draw-polygon').on('click', function(){
                   //map.un('singleclick', bccvl_common.getPointInfo);
                   bccvl_common.drawConstraints($(this), map, constraintsLayer);
               });
               $('.btn.input-polygon').on('click',  function(){
                   var coords = {};
                   coords.north = parseFloat($('#north-bounds').val());
                   coords.east = parseFloat($('#east-bounds').val());
                   coords.south = parseFloat($('#south-bounds').val());
                   coords.west = parseFloat($('#west-bounds').val());

                   bccvl_common.inputConstraints($(this), map, coords, constraintsLayer);
               });
               $('.btn.remove-polygon').on('click', function(){
                   bccvl_common.removeConstraints($(this), map, constraintsLayer);
               });
               $('.btn.draw-geojson').on('click', function(e){
                  bccvl_common.renderGeojsonConstraints($(this), map, $(this).data('geojson'), constraintsLayer);
               });
               constraintsLayer.getSource().on(['addfeature', 'removefeature', 'changefeature'], function(evt) {
                   // update coordinate inputs
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
                   // update hidden geojson field
                   if (evt.type == 'removefeature') {
                       $('#' + field_id).val('');
                   } else {
                       //encode to geoJson and write to textarea input
                       var feature = evt.feature;
                       var format = new ol.format.GeoJSON();
                       var data = format.writeFeatureObject(feature);
                       // TODO: OL3 GeoJSON formatter does not set CRS on feature or geometry  :(
                       data.crs = {
                           'type': 'name',
                           'properties': {
                               // FIXME: hardcoded CRS spec, as OL3 does not support urn's
                               'name': 'urn:ogc:def:crs:EPSG::3857'
                           }
                       };
                       // FIXME: workaround for rgdal, which can't pars 'null' properties
                       if (data.properties == null) {
                           data.properties = {};
                       }
                       data = JSON.stringify(data);
                       $('#' + field_id).val('' + data + '');
                   }
               });
           },

           /************************************************
            * project extent from crs to crs, and clip
            * given extent to extent of from crs
            */
           transformExtent: function(extent, fromcrs, tocrs) {
               var ret = ol.extent.getIntersection(extent, ol.proj.get(fromcrs).getExtent());
               if (fromcrs != tocrs) {
                   ret = ol.proj.transformExtent(ret, fromcrs, tocrs);
                   // make sure result bbox is within target crs
                   ret = ol.extent.getIntersection(ret, ol.proj.get(tocrs).getExtent());
               }
               return ret;
           },

           drawBBoxes: function(map, geometries, bboxLayer) {

               // clear any existing features
               bboxLayer.getSource().clear();
               
               geometries.forEach(function(geometry) {

                   bccvl_common.addLayerLegend(map.getTarget(), 'Climate/Env. Dataset', 'rgba(46, 204, 113, 0.9)', null, null);

                   var mapProj = map.getView().getProjection().getCode();

                   // convert geomotry to rectangle and project to map
                   var bounds = bccvl_common.transformExtent(geometry.getExtent(), 'EPSG:4326', mapProj);
                   
                   var feature = new ol.Feature({
                       geometry: new ol.geom.Polygon([[
                           ol.extent.getBottomLeft(bounds),
                           ol.extent.getBottomRight(bounds),
                           ol.extent.getTopRight(bounds),
                           ol.extent.getTopLeft(bounds),
                           ol.extent.getBottomLeft(bounds)
                       ]])
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

           },

           // RENDER PNG IMAGES
           renderPng: function(uuid, url, id){
               // NEED TO DESTROY ANY EXISTING MAP OR HTML
               var container = $('#'+id);
               if (container.hasClass('active')) {
                   container.empty();
                   map = null;
               }
               container.height('auto').html('<img src="'+url+'" alt="" />').addClass('active');
           },

           // RENDER CODE
           renderCode: function(uuid, url, id){
               // NEED TO DESTROY ANY EXISTING MAP OR HTML
               var container = $('#'+id);
               if (container.hasClass('active')) {
                   container.empty();
                   map = null;
               }
               $.ajax({
                   url: url, 
                   dataType: 'text',
                   crossDomain: true,
                   success: function( data ) {
                       container.height('auto').html('<pre><code class="language-javascript">'+data+'</code></pre>').addClass('active');
                       Prism.highlightAll();
                   },
                   error: function(jqXHR, textStatus, errorThrown){
                       if (jqXHR.status == 0){
                           container.html('Your browser does not support cross-domain-origin requests. This can be fixed by updating or using another browser.');
                       } else {
                           container.html('<pre>Problem loading data. Please try again later.</pre>');
                       }
                   }
               });
           },
           
           // RENDER CSV
           renderCSV: function(uuid, url, id){
               // NEED TO DESTROY ANY EXISTING MAP OR HTML
               var container = $('#'+id);
               if (container.hasClass('active')) {
                   container.empty();
                   map = null;
               }
               container.height('auto').html('').CSVToTable(
                   url,
                   {
                       tableClass: 'table table-striped',
                       error: function(jqXHR, textStatus, errorThrown) {
                           if (jqXHR.status == 0) {
                               container.html('Your browser does not support cross-domain-origin requests. This can be fixed by updating or using another browser.');
                           } else {
                               container.html('<pre>Problem loading data. Please try again later.</pre>').addClass('active');
                           }
                       }
                   });
           },
           
           renderPDF: function(uuid, url, id){
               // NEED TO DESTROY ANY EXISTING MAP OR HTML
               var container = $('#'+id);
               if (container.hasClass('active')) {
                   container.empty();
                   map = null;
               }
               container.html('<object type="application/pdf" data="' + url + '" width="100%" height="810px"></object>');
           } 
           
       };
       return bccvl_common;
   }
);

