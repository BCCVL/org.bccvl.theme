
// JS code to initialise the visualiser map

// PROJ4 needs to be loaded after OL3
define(['jquery', 'openlayers', 'proj4', 'ol3-layerswitcher', 'bccvl-visualiser-progress-bar',
        'd3', 'bccvl-visualiser-biodiverse', 'zip', 'bccvl-api', 'html2canvas', 'turf', 'shpjs'],
   function( $, ol, proj4, layerswitcher, progress_bar, d3, bioviz, zip, bccvlapi, html2canvas, turf, shp) {

       // define some projections we need
       proj4.defs([
           // alternatively load http://epsg.io/4283.js
           ['EPSG:4283','+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'],
           // alternatively load http://epsg.io/3577.js
           //                    http://epsg.io/3577.wkt
           //                    http://epsg.io/3577.proj4
           ['EPSG:3577', '+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=132 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs']
       ]);

       // tell ol about the projections
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


       var layer_vocab_dfrd = bccvlapi.site.vocabulary('layer_source', true).then(function(data, status, xhr) {
           var layer_vocab = {}
           $.each(data, function(index, value) {
               layer_vocab[value.token] = value;
           });
           return layer_vocab
       })

       // convex-hull polygon around occurrence dataset
       // TODO: should be removed from here.... otherwise we can only have one constraints map
       var occurrence_convexhull_polygon = null;

       // Australia Bounds
       var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
       var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
       var australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);

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
           mapRender: function(uuid, url, id, params, visibleLayer) {
               // CREATE BASE MAP
               // -------------------------------------------------------------
               var base_map = bccvl_common.renderBase(id)
               var map = base_map.map
               var visLayers = base_map.visLayers

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

               if (params.type && (params.type == 'auto' || params.type == 'occurrence')){

                   // register a listener on visLayers list to bind/unbind based on list change (whenever a new layer is added)
                   visLayers.getLayers().on('propertychange', function(e, layer) {

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
                                   map.getView().fit(layer.getExtent(), {size: map.getSize()});
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
                   bccvl_common.addLayersForDataset(uuid, url, id, visibleLayer, visLayers);
                   // add click control for point return
                   map.on('singleclick', function(evt){
                       bccvl_common.getPointInfo(evt);
                   });

                   map.on('pointermove', function(evt) {
                       bccvl_common.hoverHandler(evt);
                   });

               } else if (params.type && params.type == 'biodiverse'){

                   var cellClasses = [],
                       selectedGridCells;

                   // register a listener on visLayers list to bind/unbind based on list change (whenever a new layer is added)
                   visLayers.getLayers().on('propertychange', function(e, layer) {

                       // Clean up layer change listeners
                       for (var i = 0, key; i < layerListeners.length; i++) {
                           binding = layerListeners[i];
                           binding[0].unByKey(binding[1]);
                       }
                       layerListeners.length = 0;

                       visLayers.getLayers().forEach(function(layer) {

                           // if layer is visible we have to show legend as well
                           if (layer.getVisible()) {

                               $('#'+map.getTarget()+' .ol-viewport .ol-overlaycontainer-stopevent').append(layer.get('legend'));

                               // zoom to extent to first visible layer
                               if(layer.getSource().getExtent()){
                                   map.getView().fit(layer.getSource().getExtent(), {size: map.getSize()});
                               }
                           }

                           layer.on('change:visible', function(e) {

                               var selected;

                               map.getInteractions().forEach(function (interaction) {
                                   if(interaction instanceof ol.interaction.Select) {
                                       selected = interaction.getFeatures();
                                   }
                               });

                               // trigger ol cell unselect
                               selected.clear();
                               //bccvl_common.updateSum(0);

                               // wipe legend selects
                               d3.selectAll('rect.legend-cell')
                                   .style({stroke: "#333", "stroke-width": "0px"});

                               if (layer.getVisible()){
                                   var legend = layer.get('legend');
                                   // remove existing legend
                                   $('.olLegend').remove();

                                   // add new legend to dom tree
                                   $('#'+map.getTarget()+' .ol-viewport .ol-overlaycontainer-stopevent').append(legend);
                               }
                           });
                       });
                   });

                   // load and add layers to map
                   bioviz.addLayersForBiodiverse(map, uuid, url, id, params, visLayers);

               }

               $(map.getTargetElement()).trigger('map_created', [map, params])
               return {
                   map: map,
                   visLayers: visLayers
               }
           },

           generateRangeArr: function(styleObj){

               var standard_range = styleObj.standard_range;
               var minVal = styleObj.minVal;
               var maxVal = styleObj.maxVal;
               var steps = styleObj.steps;

               if (standard_range == 'rainfall'){
                   // rainfall BOM standard range
                   var rangeArr = [0,200,300,400,500,600,800,1000,1200,1600,2000,2400,3200];
               } else if (standard_range == 'monrainfall'){
                   // rainfall BOM standard range
                   var rangeArr = [0,100,200,300,400,500,600,700,800,900,1000,1100,1200];
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
               } else if (standard_range == 'misc_categorical') {
                   var rangeArr = [];
                   for (var i = 0; i < (steps); i++) {
                       rangeArr.push(minVal + i);
                   }
               } else if (standard_range == 'range-change'){

                   var rangeArr = [0,1,2,3];
               } else if (standard_range == 'probability-difference'){
                   var rangeArr =  [     -1 ,    -0.8,       -0.6,     -0.4,       -0.2,       0,        0.2,       0.4,       0.6,       0.8,       1     ]
               } else if (standard_range == 'pH'){

                   var rangeArr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
               } else if (standard_range == 'boolean'){

                   var rangeArr = [0,1];
               } else if (steps == 1){
                   // generic single value
                   var rangeArr = [minVal];
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

               // convert to five-point scheme, this is currently only in use for default/no metadata datasets
               if (typeof styleObj.secondpoint != 'undefined' || typeof styleObj.fourthpoint != 'undefined' ) {
                   var secondpoint = styleObj.secondpoint;
                   var fourthpoint = styleObj.fourthpoint;
               } else {
                   var secondpoint = null;
                   var fourthpoint = null;
               }


               var steps = styleObj.steps;
               if (standard_range == 'rainfall'){
                   // rainfall BOM standard colours
                   var colorArr = ['#FFFFFF','#fffee8','#fefdd1','#f6f8ab','#daeca2','#c1e3a3','#a8dba4','#8cd1a4','#6fc9a5','#45c1a4','#00b4a5','#00999a','#017b7d','#005b5c'];
               } else if (standard_range == 'monrainfall'){
                   // monthly rainfall colours
                   var colorArr = ['#FFFFFF','#f0fcff','#d9f8ff','#bff3ff','#a3edff','#86e5ff','#6fdbff','#5bccfb','#4eb8f5','#439eec','#3b81e2','#3562d8','#3146ce','#2d2ec6'];
               } else if (standard_range == 'temperature') {
                   // temperature BOM standard colours
                   // rangeArr =  [      <-6,        -6,       -3,       0,         3,        6,        9,       12,       15,       18,       21,      24,       27,        30,       33,       36,       39,       42,      45 ];
                   var colorArr = ['#990099','#fe00fe','#ffb4ff','#cccccc','#6767fe','#33ccff','#99fefe','#00cc00','#67ff67','#ccfecc','#fefecc','#ffff34','#ffcc66','#ffcccc','#ff9999','#ff3333','#cc0000','#895b2e', '#6d4218'];
               } else if (standard_range == 'suitability' && startpoint == null) {
                   // apply standard suitability coloring only if we don't have a color range set up
                   // FIXME: generate default color range for suitabilities automatically as we do below if possible
                   // basic prob spectrum
                   var colorArr = ['#FFFFFF','#fef8f8','#fdefef','#fce4e4','#fbd8d8','#facbcb','#f9bdbd','#f7aeae','#f69f9f','#f48f8f','#f28080','#f17070','#ef6060','#ee5151','#ec4242','#eb3434','#ea2727','#e91b1b','#e81010','#e70707','#d80707'];
               } else if (standard_range == 'categorical' || standard_range == 'misc_categorical') {
                   var colorArr = [];
                   for (var i = 0; i < (steps+1); i++) {
                       colorArr.push('#'+bccvl_common.genColor(i+1));
                   }
               } else if (standard_range == 'occurrence') {
                   var colorArr = ['#e74c3c'];
               } else if (standard_range == 'absence') {
                   var colorArr = ['#3498db'];
               } else if (standard_range == 'range-change') {
                   var colorArr = ['#FFFFFF', '#f08013', '#FFFFFF', '#164dca', '#41c127'];
               } else if (standard_range == 'probability-difference') {
                   // rangeArr =  [     -1 ,    -0.8,       -0.6,     -0.4,       -0.2,       0,        0.2,       0.4,       0.6,       0.8,       1     ]
                   var colorArr = ['#B41414', '#C34343', '#D27272', '#E1A1A1', '#F0D0D0', '#FFFFFF', '#e7f2fb', '#CEE6FA', '#9DCDF5', '#6CB4F0', '#3B9BEB', '#0A82E6'];
               } else if (standard_range == 'pH') {
                   // rangeArr =  [        0,         1,         2,         3,         4,         5,         6,         7,         8,         9,        10,        11,        12,        13,        14]
                   var colorArr = ['#ee1c25', '#f26722', '#f8c611', '#f4ec1b', '#b4d433', '#83c240', '#4db748', '#33a949', '#21b569', '#09bab4', '#4591cb', '#3853a4', '#5952a2', '#62469d', '#462c83'];
               } else if (standard_range == 'boolean') {
                   // rangeArr =  [        0,         1,]
                   var colorArr = ['#4db748', '#4591cb'];
               } else if (steps == 1){
                   //generic single value
                   var colorArr = ['#fd3d00'];
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

                   if (midpoint != null && secondpoint != null && fourthpoint != null){

                       // first section
                       for (var i = 0; i < (steps/4); i++) {
                           // red
                           var redInt = (startpoint.r - secondpoint.r)/(steps/4);
                           var redVal = startpoint.r - (redInt*i);
                           // green
                           var greenInt = (startpoint.g - secondpoint.g)/(steps/4);
                           var greenVal = startpoint.g - (greenInt*i);
                           // blue
                           var blueInt = (startpoint.b - secondpoint.b)/(steps/4);
                           var blueVal = startpoint.b - (blueInt*i);

                           colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                       }

                       // second section
                       for (var i = 0; i < (steps/4); i++) {
                           // red
                           var redInt = (secondpoint.r - midpoint.r)/(steps/4);
                           var redVal = secondpoint.r - (redInt*i);
                           // green
                           var greenInt = (secondpoint.g - midpoint.g)/(steps/4);
                           var greenVal = secondpoint.g - (greenInt*i);
                           // blue
                           var blueInt = (secondpoint.b - midpoint.b)/(steps/4);
                           var blueVal = secondpoint.b - (blueInt*i);

                           colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                       }

                       // third section
                       for (var i = 0; i < (steps/4); i++) {
                           // red
                           var redInt = (midpoint.r - fourthpoint.r)/(steps/4);
                           var redVal = midpoint.r - (redInt*i);
                           // green
                           var greenInt = (midpoint.g - fourthpoint.g)/(steps/4);
                           var greenVal = midpoint.g - (greenInt*i);
                           // blue
                           var blueInt = (midpoint.b - fourthpoint.b)/(steps/4);
                           var blueVal = midpoint.b - (blueInt*i);

                           colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                       }

                       // fourth section
                       for (var i = 0; i < ((steps/4)+1); i++) {
                           // red
                           var redInt = (fourthpoint.r - endpoint.r)/(steps/4);
                           var redVal = fourthpoint.r - (redInt*i);
                           // green
                           var greenInt = (fourthpoint.g - endpoint.g)/(steps/4);
                           var greenVal = fourthpoint.g - (greenInt*i);
                           // blue
                           var blueInt = (fourthpoint.b - endpoint.b)/(steps/4);
                           var blueVal = fourthpoint.b - (blueInt*i);

                           colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                       }

                   } else if (midpoint != null){

                       // White to red spectrum fallback
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

                       // otherwise use supplied

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
               if ($.inArray(layerdef.legend, ['rainfall', 'monrainfall', 'temperature', 'suitability', 'probability-difference', 'range-change']) > -1) {
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

               if(layerdef.legend == "pH"){
                   layerdef.style.standard_range="pH"
               } else if(layerdef.legend == "boolean"){
                   layerdef.style.standard_range="boolean"
               }

               var xmlStylesheet;
               if (layerdef.type == 'occurrence' || layerdef.type == 'absence') {
                   xmlStylesheet = '<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"><NamedLayer><Name>DEFAULT</Name><UserStyle><Title></Title><FeatureTypeStyle><Rule><PointSymbolizer><Graphic>';
                   xmlStylesheet += '<Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">'+layerdef.style.color+'</CssParameter></Fill></Mark><Size>5</Size>';
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

                   if (layerdef.style.standard_range == 'boolean') {
                       for (var i = 0; i < colorArr.length; i++) {
                           xmlStylesheet += '<se:Threshold>'+rangeArr[i]+'</se:Threshold><se:Value>'+colorArr[i]+'</se:Value>';
                       }
                   } else if (steps == 1 && rangeArr.length == 1){
                        xmlStylesheet += '<se:Value>#FFFFFF</se:Value><se:Threshold>'+rangeArr[0]+'</se:Threshold><se:Value>'+colorArr[0]+'</se:Value>';
                   } else {
                       for (var i = 0; i < (colorArr.length-1); i++) {
                           xmlStylesheet += '<se:Value>'+colorArr[i]+'</se:Value><se:Threshold>'+rangeArr[i]+'</se:Threshold>';
                       }
                       xmlStylesheet += '<se:Value>'+colorArr[colorArr.length-1]+'</se:Value>';
                   }
                   xmlStylesheet += '</se:Categorize></se:ColorMap></se:RasterSymbolizer></se:Rule></se:FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';
               }

               //simple error message for SLD's that are too long
               var m = encodeURIComponent(xmlStylesheet).match(/%[89ABab]/g);
               if ( (xmlStylesheet.length + (m ? m.length : 0)) >= 7000){
                   alert("We're sorry, this dataset contains too many categories to be visualised in the BCCVL (the resulting WMS requests are too long to process).");
               }

               return xmlStylesheet;
           },

           createStyleObj: function(layerdef, uuid) {
               var styleObj;
               var style = $.Deferred();

               if (layerdef.legend == 'range-change') {
                    // if it is a range-change we have a fixed set of categories
                    styleObj = {
                        minval: 0,
                        maxVal: 3,
                        steps: 4,
                        startpoint: {},
                        midpoint: {},
                        endpoint: {},
                        // FIXME: standard_range is quite chaotic,.... sometimes it is generic,
                        //        in other places too specific (e.g. createLegend assumes it is a ClampingMask if standard_range=='discrete')
                        // standard_range: 'categorical'
                        standard_range: 'range-change'
                    }
                    // also our labels are fixd
                    layerdef.labels = [
                        'Contraction',
                        'Absent no change',
                        'Present no change',
                        'Expansion'
                    ]
                    style.resolve(styleObj, layerdef)
                    return style

               } else if (layerdef.legend == 'binary'){

                   styleObj = {
                       // need to define the min as slightly more than zero
                       // due to SLD matching spec.
                       minVal: 0.0000001,
                       maxVal: 1,
                       steps: 1,
                       startpoint: null,
                       midpoint: null,
                       endpoint: null
                   };

                   styleObj.standard_range = 'binary';

                   style.resolve(styleObj, layerdef);

                   return style;

               } else if (layerdef.legend == 'boolean' && layerdef.datatype == 'discrete'){

                   // count number of rows, number is inclusive so requires offset
                   var numRows = layerdef.max - layerdef.min + 1;
                   var labels = [];
                   for (var i = 0; i < numRows; i++) {
                       labels.push('Boolean '+(layerdef.min+i));
                   }
                   layerdef.labels = labels;

                   styleObj = {
                       // get number of rows from layerdef, make equivalent number of steps
                       minVal: layerdef.min,
                       maxVal: layerdef.max,
                       steps: numRows,
                       startpoint: null,
                       midpoint: null,
                       endpoint: null,
                       standard_range: 'boolean'
                   };

                   style.resolve(styleObj, layerdef);

                   return style;

               } else if (layerdef.legend == 'categories' || layerdef.datatype == 'categorical' || layerdef.datatype == 'discrete') {
                   bccvlapi.dm.get_rat(uuid, layerdef.token, true).then(
                       function(data, status, jqXHR) {

                           var numRows = data.rows.length;
                           var labels = [];
                           var hasDataForStyle = false;
                           
                           $.each(data.cols, function(i, col){
                               if (col.usage == 'Generic' || col.usage == 'Name'){
                                   hasDataForStyle = true;
                               } 
                           });
                           
                           if (hasDataForStyle){

                               var valueIndex = -1;
                               for (var i = 0; i < data.cols.length; i++) {
                                  if (data.cols[i].type == 'Integer' && data.cols[i].name == 'VALUE') {
                                    valueIndex = i;
                                    break;
                                  }
                               }
    
                               $.each( data.rows, function(i, row){
                                   //labels.push([]);
                                   var label = ''+(valueIndex >= 0 ? row[valueIndex] : (i+1))+':';
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
                           } else {
                               // nothing useful to style e.g. histogram
                               styleObj = {
                                   minVal: 0,
                                   maxVal: 1,
                                   steps: 1,
                                   startpoint: {},
                                   midpoint: {},
                                   endpoint: {}
                               };
                           }

                           style.resolve(styleObj, layerdef);
                       },
                       function(data, status, jqXHR){
                           console.log('RAT failed, no metadata for layertype');
                           // count number of rows, number is inclusive so requires offset
                           var numRows = layerdef.max - layerdef.min + 1;
                           var labels = [];
                           for (var i = 0; i < numRows; i++) {
                               labels.push('Unclassified Layer '+(layerdef.min+i));
                           }
                           layerdef.labels = labels;

                           layerdef.tooltip = "No layer metadata is available for this dataset. Select a classification using the Edit options on the dataset search interface for more accurate visualisations."

                           styleObj = {
                               // get number of rows from layerdef, make equivalent number of steps
                               minVal: layerdef.min,
                               maxVal: layerdef.max,
                               steps: numRows,
                               startpoint: null,
                               midpoint: null,
                               endpoint: null,
                               standard_range: 'misc_categorical'
                           };

                           style.resolve(styleObj, layerdef);
                       }
                   );

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

               } else {
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
                   //} else if (standard_range == 'probability-difference') {
                   //    // values between -1.0 and 1.0
                   //    styleObj = {
                   //        minVal: -1.0,
                   //        maxVal: 1.0,
                   //        steps: 9,
                   //        startpoint: {r:180, g:20, b:20},
                   //        midpoint: {r:255, g:255, b:255},
                   //        endpoint: {r:10, g:130, b:230}
                   //    }
                    } else if (standard_range == 'default') {
                       var calcSteps = 20;
                       if (layerdef.max - layerdef.min == 0){
                           calcSteps = 1;

                           styleObj = {
                               minVal: layerdef.min,
                               maxVal: layerdef.max,
                               steps: calcSteps,
                               startpoint: null,
                               secondpoint: null,
                               midpoint: null,
                               fourthpoint: null,
                               endpoint: {r:235,g:61,b:0}
                           };
                       } else {
                           // standard raster
                           styleObj = {
                               minVal: layerdef.min,
                               maxVal: layerdef.max,
                               steps: calcSteps,
                               startpoint: {r:2,g:95,b:201},
                               secondpoint: {r:2,g:201,b:166},
                               midpoint: {r:62,g:193,b:48},
                               fourthpoint: {r:240,g:255,b:0},
                               endpoint: {r:235,g:61,b:0}
                           };
                       }
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
               if(layerdef.legend == "pH"){
                   layerdef.style.standard_range="pH"
               } else if(layerdef.legend == "boolean"){
                   layerdef.style.standard_range="boolean"
               }
               // create a legend for given values

               // Get hex color range and map values
               var rangeArr = bccvl_common.generateRangeArr(layerdef.style);
               var colorArr = bccvl_common.generateColorArr(layerdef.style);
               var standard_range = layerdef.style.standard_range;
               var steps = layerdef.style.steps;
               // determine step size for legend
               var legend_step_size = (rangeArr.length-1)/10;

               if (standard_range == 'suitability') {
                   legend_step_size = 2;
               } else if ($.inArray(standard_range, ['rainfall', 'monrainfall', 'temperature', 'categorical', 'misc_categorical', 'binary', 'range-change', 'probability-difference', 'pH', 'boolean']) > -1) {
                   legend_step_size = 1;
               } else if (steps == 1){
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
                   if (standard_range == 'misc_categorical'){
                       panel.innerHTML += '<h5>Categories '+popover+'</h5>';
                   } else {
                       panel.innerHTML += '<h5>' + layerdef.unit + ' '+popover+'</h5>';
                   }
               } else {
                   if (standard_range == 'binary') {
                       panel.innerHTML += '<h5>Occurrence</h5>';
                   } else if (standard_range == 'discrete') {
                       panel.innerHTML += '<h5>Mask</h5>';
                   } else if (standard_range == 'suitability') {
                       panel.innerHTML += '<h5>Suitability</h5>';
                   } else if (standard_range == 'categorical' || standard_range == 'misc_categorical') {
                       panel.innerHTML += '<h5>Dataset Categories</h5>';
                   } else {
                       panel.innerHTML += '<h5>' + layerdef.unit + '</h5>';
                   }
               }

               for (var i = 0; i < (rangeArr.length); i = i+legend_step_size) {
                   if (standard_range == 'categorical' || standard_range == 'misc_categorical' || standard_range == 'range-change'){
                       panel.innerHTML += '<label><i style="background:'+colorArr[i+1]+'"></i>'+layerdef.labels[i]+'</label>';
                   } else if (standard_range == 'boolean'){
                      panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>'+rangeArr[i]+'</label>';
                   } else if (standard_range == 'binary'){
                       if (rangeArr[i] > 0){
                           panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>True</label>';
                       }

                   } else if (standard_range == 'temperature'){
                       if (i == (rangeArr.length-1)){
                           panel.innerHTML += '<label><i style="background:'+colorArr[i+1]+'"></i>&nbsp;'+bccvl_common.numPrec(rangeArr[i], 2)+'&nbsp;+</label>';
                       } else if (i == 0) {
                           panel.innerHTML += '<label><i style="background:'+colorArr[i+1]+'"></i>&nbsp;&lt;'+bccvl_common.numPrec(rangeArr[i], 2)+'&nbsp;-&nbsp;'+bccvl_common.numPrec(rangeArr[i+legend_step_size], 2)+'</label>';
                       } else {
                           panel.innerHTML += '<label><i style="background:'+colorArr[i+1]+'"></i>&nbsp;'+bccvl_common.numPrec(rangeArr[i], 2)+'&nbsp;-&nbsp;'+bccvl_common.numPrec(rangeArr[i+legend_step_size], 2)+'</label>';
                       }
                   } else if (legend_step_size == 1 && steps == 1){
                       panel.innerHTML += '<label><i style="background:'+colorArr[0]+'"></i>&nbsp;'+rangeArr[0]+'&nbsp;</label>';

                   } else {

                       if (i == (rangeArr.length-1)){
                           panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+bccvl_common.numPrec(rangeArr[i], 5)+'&nbsp;+</label>';
                       } else if (i == 0) {
                           panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;&lt;'+bccvl_common.numPrec(rangeArr[i], 5)+'&nbsp;-&nbsp;'+bccvl_common.numPrec(rangeArr[i+legend_step_size], 5)+'</label>';
                       } else {
                           panel.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+bccvl_common.numPrec(rangeArr[i], 5)+'&nbsp;-&nbsp;'+bccvl_common.numPrec(rangeArr[i+legend_step_size], 5)+'</label>';
                       }
                   }
               }

               legend.appendChild(button);
               legend.appendChild(panel);

               return legend;
           },

           exportAsImage: function(e, map) {

              var hiddenEl = $(map.getTargetElement()).find('.export-map-hidden');

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
              var imageTitle = 'BCCVL ';

              // add visible layers into filename
              imageTitle += ' -- ' + visible.join(", ");

              // append filename
              hiddenEl.attr('download', imageTitle+'.png');

              html2canvas(map.getTargetElement(), {
                  onrendered: function(canvas) {
                      hiddenEl.attr('href', canvas.toDataURL('image/png'));
                      hiddenEl[0].click();
                 }
              });

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
                   var projwkt = layerdef.projwkt;
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
                   url: bccvlapi.visualiser.wms_url,
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

               if (bounds && (proj || projwkt)) {
                   var extent = bccvl_common.transformExtent(bounds, proj, 'EPSG:3857', projwkt);
                   if (extent) {
                       newLayer.setExtent(extent);
                   }
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
                           if (lyr.get('type') != 'base' && lyr.get('type') != 'constraint' && lyr.getVisible()) {
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

           renderBase: function(id) {
               // RENDER EMPTY MAP
               // CREATE BASE MAP
               // -------------------------------------------------------------------------------------------
               var map;

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
                           title: 'ALA Outline',
                           type: 'base',
                           visible: false,
                           source: new ol.source.TileWMS({
                            url: 'https://spatial.ala.org.au/geoserver/gwc/service/wms/reflect',
                            params: {'LAYERS': 'ALA:world', 'FORMAT': 'image/jpeg', 'VERSION':'1.1.1', 'SRS':'EPSG:3857'}
                          })
                       }),
                       new ol.layer.Tile({
                           title: 'OSM',
                           type: 'base',
                           preload: 5,
                           visible: true,
                           source: new ol.source.OSM()
                       })
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
               map.getView().fit(australia_bounds, {size: map.getSize()});

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
               $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append('<a class="export-map-hidden ol-control" download="map.png" href="" style="opacity:0;">Hidden</a>');
               $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append('<a class="export-map ol-control" href="javascript:void();"><i class="fa fa-save"></i> Image</a>');

               $('#'+id+' a.export-map').click(function(e){
                   e.preventDefault();
                   bccvl_common.exportAsImage(e, map);
               });

               return {
                   map: map,
                   visLayers: visLayers
               }
           },


           addLayersForDataset: function(uuid, url, id, visibleLayer, visLayers) {
               // styObj ... override given certain styleObj parameters
               var dfrd = $.Deferred();

               // big loading indicator for fetch request, this could be added
               // to the fetch function itself if it could reference the map
               $('#'+id+' .ol-viewport').prepend('<div class="map-loading"></div>');

               var fetch_dfrd = bccvlapi.visualiser.fetch(
                   {
                       'datasetid': uuid,
                       'DATA_URL': url,
                       'INSTALL_TO_DB': false
                   }
               ).then(
                   // visualiser fetch went well
                   function(status) {
                       $('#'+id+' .ol-viewport').find('.map-loading').remove();
                       return bccvlapi.dm.metadata(uuid, root=true)
                   },
                   // visualiser fetch failed
                   function(error) {
                       $('#'+id+' .ol-viewport').find('.map-loading').remove();
                       alert('Problem requesting map or file.  This may be due to poor internet connectivity or heavy traffic, please try again later.')
                       // need to return some error here?
                   }
               )

               $.when(fetch_dfrd, layer_vocab_dfrd).then(
                   // metadata received
                   function(data, layer_vocab) {
                       // jquery doesn't call this success handler if there was an error in the previous chain
                       // define local variables
                       var layerdef;

                       // check for layers metadata, if none exists then the request is returning a data like a csv file
                       // TODO: alternative check data.mimetype == 'text/csv' or data.genre
                       //       or use type passed in as parameter
                       if ($.isEmptyObject(data.layers) || data.genre == "DataGenreSpeciesOccurrence" || data.genre == "DataGenreSpeciesCollection" || data.genre == "DataGenreSpeciesAbsence" || data.genre == "DataGenreTraits") {
                           // species data  (not a raster)
                           // TODO: use data.title (needs to be populated)
                           layerdef = {
                               'title': data.title || data.description || 'Data Overlay',
                               'bounds': data.bounds,
                               'projection': data.srs || 'EPSG:4326',
                               'projwkt': data.projection
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
                               data.genre == "DataGenreSpeciesCollection" ||
                               data.genre == "DataGenreSpeciesOccurEnv" ||
                               data.genre == "DataGenreTraits") {
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
                                   if (data.genre == 'DataGenreCP' || data.genre == 'DataGenreCP_ENVLOP' || data.genre == 'DataGenreFP' || data.genre == 'DataGenreFP_ENVLOP') {
                                       layerdef.legend = 'suitability';
                                       layerdef.unit = ' ';
                                       layerdef.unitfull = 'Environmental suitability';
                                       layerdef.tooltip = 'This value describes the environmental suitability of a species presence in a given location.';
                                   }
                                   else if (data.genre == 'DataGenreENDW_RICHNESS') {
                                        layerdef.title = "Species Richness";
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
                               layerdef.projwkt = layer.projection;
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
                   }
               );

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
                   type: /** @type {ol.geom.GeometryType} */ 'Polygon',
                   //geometryFunction: geometryFunction,
                   //maxPoints: 2
               });

               draw.on('drawstart', function(evt){
                   // this isn't being used... yet
               });

               draw.on('drawend', function(evt){
                   evt.feature.setId('geo_constraints');
                   // interaction finished, free up mouse events
                   map.removeInteraction(draw);

                   var geom = evt.feature.getGeometry();
                   //map.on('singleclick', bccvl_common.getPointInfo)
                   bccvl_common.estimateGeoArea(map, geom);
               });

               map.addInteraction(draw);
           },

            // no longer in use
           //inputConstraints: function(el, map, coords, constraintsLayer){
//
           //    // clear layer
           //    constraintsLayer.getSource().clear();
//
           //    var bounds = [
           //        [coords.west, coords.north],
           //        [coords.east, coords.north],
           //        [coords.east, coords.south],
           //        [coords.west, coords.south],
           //        [coords.west, coords.north]
           //    ];
//
           //    var polygon = new ol.geom.Polygon([bounds]);
           //    var mapProj = map.getView().getProjection().getCode();
           //    polygon.transform('EPSG:4326', mapProj);
//
           //    var feature = new ol.Feature({
           //        geometry: polygon
           //    });
//
           //    feature.setId('geo_constraints');
//
           //    var style = new ol.style.Style({
           //        fill: new ol.style.Fill({
           //            color: 'rgba(0, 160, 228, 0.1)'
           //        }),
           //        stroke: new ol.style.Stroke({
           //            color: 'rgba(0, 160, 228, 0.9)',
           //            width: 2
           //        })
           //    });
//
           //    feature.setStyle(style);
           //    constraintsLayer.getSource().addFeature(feature);
//
           //},

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

               map.getView().fit(feature.getGeometry().getExtent(), {size: map.getSize(), padding: [50,50,50,50]});
           },

           estimateGeoArea: function(map, geomObject){

               var wgs84Sphere = new ol.Sphere(6378137);
               var sourceProj = map.getView().getProjection();
               var geom = /** @type {ol.geom.Polygon} */(geomObject.clone().transform(
                    sourceProj, 'EPSG:4326'));
               var coordinates = geom.getLinearRing(0).getCoordinates();
               var area = Math.abs(wgs84Sphere.geodesicArea(coordinates));

               var output;
               if (area > 10000) {
                 output = (Math.round(area / 1000000 * 100) / 100) +
                     ' ' + 'km<sup>2</sup>';
               } else {
                 output = (Math.round(area * 100) / 100) +
                     ' ' + 'm<sup>2</sup>';
               }

               $('#estimated-area > em').html('Estimated area '+output+' <hr/>');
           },

           renderPolygonConstraints: function(map, geomObject, constraintsLayer, projCode){

               // clear layer
               constraintsLayer.getSource().clear();

               var feature = new ol.Feature({geometry: geomObject});

               var bounds;

               // Do projection only if they are in different projection
               if (projCode != map.getView().getProjection().getCode()) {
                  // convert geomotry to rectangle and project to map
                  bounds = bccvl_common.transformExtent(feature.getGeometry().getExtent(), 'EPSG:4326', map.getView().getProjection());

                  feature.getGeometry().transform('EPSG:4326',map.getView().getProjection());
               }

               var style = new ol.style.Style({
                   fill: new ol.style.Fill({
                       color: 'rgba(0, 160, 228, 0.1)'
                   }),
                   stroke: new ol.style.Stroke({
                       color: 'rgba(0, 160, 228, 0.9)',
                       width: 2
                   })
               });

               // redefine feature if it didn't project properly
               // use extent bounds/coordinates specifically and dump feature
               var projectionFailed = false;

               $.each(feature.getGeometry().getExtent(), function(i,n){
                   if(isNaN(n)){
                       projectionFailed = true;
                   }
               })

               if (projectionFailed){
                   feature = new ol.Feature({
                       geometry: new ol.geom.Polygon([[
                           ol.extent.getBottomLeft(bounds),
                           ol.extent.getBottomRight(bounds),
                           ol.extent.getTopRight(bounds),
                           ol.extent.getTopLeft(bounds),
                           ol.extent.getBottomLeft(bounds)
                       ]])
                   });
               }

               feature.setId('geo_constraints');

               feature.setStyle(style);
               constraintsLayer.getSource().addFeature(feature);

               bccvl_common.estimateGeoArea(map, feature.getGeometry());

               // Convert and write to geojson for offset tools.
               var featureGroup = constraintsLayer.getSource().getFeatures();

               var geojson  = new ol.format.GeoJSON();

               var as_geojson = geojson.writeFeatures(featureGroup, {
                 featureProjection: 'EPSG:3857',
                 dataProjection: 'EPSG:4326'
               });

               $('#add-conv-hull-offset').data('geojson', as_geojson);

               map.getView().fit(feature.getGeometry().getExtent(), {size: map.getSize(), padding: [50,50,50,50]});
           },

           setOccurrencePolygon: function(polygon) {
              occurrence_convexhull_polygon = polygon;
           },

           drawConvexhullPolygon: function(url, filename, mimetype, map, constraintsLayer) {
              function renderConvexhullPolygon(polygon, map, constraintsLayer) {
                  // Generate convex-hull polygon for the occurrence dataset
                  var vhull = d3.polygonHull(polygon);
                  vhull.push(vhull[0]);
                  var hull1 = [vhull];
                  var polygonHull = new ol.geom.Polygon(hull1);
                  // Save the polygon and render it on map

                  bccvl_common.setOccurrencePolygon(polygonHull);
                  bccvl_common.renderPolygonConstraints(map, polygonHull, constraintsLayer, 'EPSG:4326');
              }

              if (mimetype == 'application/zip') {
                  // Extract occurrence dataset from zip file
                  zip.useWebWorkers = false;
                  var httpReader = new zip.HttpReader(url);
                  var zipReader = zip.createReader(httpReader, function(reader) {
                      // get all entries from the zip
                      reader.getEntries(function(entries) {
                          // Look for file that end with filename.
                          for (var i = 0; i < entries.length; i++) {
                              if (!entries[i].filename.endsWith(filename)) {
                                  continue;
                              }
                              // Get the data
                              entries[i].getData(new zip.TextWriter(), function(data) {
                                  // Parse data to extract the coordinates
                                  var points = d3.csvParse(data, function(d) {
                                      return [ +d["lon"], +d["lat"] ];
                                  });

                                  // Draw convex-hull polygon for the occurrence dataset
                                  renderConvexhullPolygon(points, map, constraintsLayer);

                                  // close the zip reader
                                  reader.close();
                              });
                          }
                      });

                  }, function(error) {
                      // onerror callback
                      console.log("drawConvexhullPolygon:", error);
                      throw error;
                  });
              }
              else if (mimetype == 'text/csv') {
                  d3.csv(url, function(error, data) {
                      if (error) throw error;
                      var points = data.map(function(d) {
                          return [ +d["lon"], +d["lat"] ];
                      });
                      renderConvexhullPolygon(points, map, constraintsLayer);
                  });
              }
           },

           removeConstraints: function(el, map, constraintsLayer) {
               // clear vector source
               constraintsLayer.getSource().clear();
           },

           constraintTools: function(map, constraintsLayer, field_id) {

               // set up accordion-like functionality for the UI
               $('input[type="radio"][name="constraints_type"]').change(function(){
                  $('.constraint-method').find('input[type="radio"][name="constraints_type"]').each(function(){
                     $('#estimated-area > em').html('');
                     if($(this).prop('checked')){
                         $(this).parents('.constraint-method').find('.config').slideDown();
                     } else {
                         $(this).parents('.constraint-method').find('.config').slideUp();
                     }
                  })
               });


               $('input[type="radio"]#use_convex_hull').change(function(){
                 bccvl_common.removeConstraints($(this), map, constraintsLayer);

                 if($(this).prop('checked')){
                    $(this).parents('.constraint-method').find('.geojson-offset').slideDown();

                    var selected = $('#form-widgets-species_occurrence_dataset .selected-item input');

                    if (occurrence_convexhull_polygon != null) {
                      bccvl_common.renderPolygonConstraints(map, occurrence_convexhull_polygon,
                        constraintsLayer, map.getView().getProjection().getCode());
                    } else {

                        alert('No occurence selection could be found to generate a convex hull polygon. Please return to the occurrences tab and make a selection.');
                    }
                 }
               });


               $('input[type="radio"]#use_enviro_env').change(function(){
                 bccvl_common.removeConstraints($(this), map, constraintsLayer);
                 if($(this).prop('checked')){

                    var extent;

                    var bboxes = $('body').find('input[data-bbox]');

                    if(bboxes.length > 0){
                        var geom;
                        $('body').find('input[data-bbox]').each(function(){
                            if($(this).data('genre') != 'DataGenreSpeciesOccurrence' && $(this).data('genre') != 'DataGenreSpeciesAbsence') {
                                geom = $(this).data('bbox');
                                geom = new ol.geom.Polygon([[
                                    [geom.left, geom.bottom],
                                    [geom.right, geom.bottom],
                                    [geom.right, geom.top],
                                    [geom.left, geom.top],
                                    [geom.left, geom.bottom]
                                ]]);
                                geom.type = $(this).data('genre');

                                if (typeof extent !== "undefined"){
                                    extent = ol.extent.getIntersection(extent, geom.getExtent());
                                } else {
                                    extent = geom.getExtent();
                                }
                            }
                        });

                        //var geojson = new ol.format.GeoJSON();
                        //var feat = new ol.geom.Polygon.fromExtent(extent);

                        bccvl_common.renderPolygonConstraints(map, geom, constraintsLayer, 'EPSG:4326');
                    } else {
                        alert('No selections made on previous tabs. Please select occurence and environmental datasets.');
                    }



                 }
               });

               $('input[type="radio"]#upload_shp_file').change(function(){
                 bccvl_common.removeConstraints($(this), map, constraintsLayer);

                 if($(this).prop('checked')){

                 } else {
                     $('#upload-shape').find('input').val('');
                 }
               });
               $('.btn.draw-polygon').on('click', function(){
                   //map.un('singleclick', bccvl_common.getPointInfo);
                   bccvl_common.drawConstraints($(this), map, constraintsLayer);
               });
               $('.btn.remove-polygon').on('click', function(){
                   bccvl_common.removeConstraints($(this), map, constraintsLayer);


                   // Display the convex-hull polygon around occurrence dataset
                   if (occurrence_convexhull_polygon != null) {

                      bccvl_common.renderPolygonConstraints(map, occurrence_convexhull_polygon,
                        constraintsLayer, map.getView().getProjection().getCode());
                      $('input[type="radio"]#use_convex_hull').prop('checked', true);
                   }

               });
               $('.btn.draw-geojson').on('click', function(e){

                  bccvl_common.renderGeojsonConstraints($(this), map, $(this).data('geojson'), constraintsLayer);
               });
               $('.btn.add-offset').on('click', function(e){

                   var offsetSize = $(this).parent().find('.region-offset').val();
                   if(offsetSize){

                       var geojson = JSON.parse($(this).data('geojson'));

                       var simpPoly = [];
                       if(geojson.type == "Feature"){
                           $.each(geojson.geometry.coordinates, function(i, poly){
                               var turfpoly = turf.polygon(poly);
                               var options = {tolerance: 0.01, highQuality: false, mutate: true};
                               var simplified = turf.simplify(turfpoly, options);
    
                               simpPoly.push(simplified.geometry.coordinates);
                           });
    
                           geojson.geometry.coordinates = simpPoly;
                       } else if (geojson.type == "FeatureCollection"){
                            $.each(geojson.features, function(i, feature){

                                $.each(feature.geometry.coordinates, function(i, poly){

                                   var turfpoly = turf.polygon([poly]);
                                   var options = {tolerance: 0.01, highQuality: false, mutate: true};
                                   var simplified = turf.simplify(turfpoly, options);
        
                                   simpPoly.push(simplified.geometry.coordinates);
                               });
                            });
                           
                           // rebuild geojson into expected format
                           var geojson = {
                               type: "Feature",
                               geometry: {
                                   type: "MultiPolygon",
                                   coordinates: simpPoly
                               }
                           }
                       }

                       var buffered = turf.buffer(geojson, offsetSize, {"units":"kilometers"});
                       var newgeo = JSON.stringify(buffered);

                       bccvl_common.renderGeojsonConstraints($(this), map, newgeo, constraintsLayer);
                   } else {
                       $(this).parent().find('.region-offset').addClass('required error');
                   }
               });
               constraintsLayer.getSource().on(['addfeature', 'removefeature', 'changefeature'], function(evt) {

                   // update hidden geojson field
                   if (evt.type == 'removefeature') {
                       $('#' + field_id).val('');
                   } else {

                       //encode to geoJson and write to textarea input
                       var features = constraintsLayer.getSource().getFeatures();
                       var format = new ol.format.GeoJSON();
                       var data = format.writeFeaturesObject(features);

                       // TODO: OL3 GeoJSON formatter does not set CRS on feature or geometry  :(
                       data.crs = {
                           'type': 'name',
                           'properties': {
                               // FIXME: hardcoded CRS spec, as OL3 does not support urn's
                               'name': 'urn:ogc:def:crs:EPSG::3857'
                           }
                       };
                       // FIXME: workaround for rgdal, which can't pars 'null' properties
                       data.features.forEach(function(feature) {
                            if (feature.properties == null) {
                              feature.properties = {};
                            }
                       });
                       if (data.properties == null) {
                           data.properties = {};
                       }

                       var constraint_method = $(".constraint-method").has('input[type="radio"][name="constraints_type"]:checked');
                       var method = constraint_method.find('input[type="radio"][name="constraints_type"]').val();
                       var methodname = constraint_method.find("label[for='" + method + "']").text();
                       var offset = constraint_method.find('input[type="text"][name="region-offset"]').val();

                       data.properties['constraint_method'] = {title: methodname, id: method};
                       if (typeof offset != 'undefined') {
                          data.properties['region_offset'] = offset;
                       }

                       if (method == 'region_no_offset') {
                          var region_type = constraint_method.find('#select-region-type').find('option:selected');
                          var region_name = constraint_method.find('.select-region').find('option:selected');

                          if (typeof region_type != "undefined") {
                            data.properties['region_type'] = {title: region_type.text(), id: region_type.val()};
                          }
                          if (typeof region_name != "undefined") {
                            data.properties['region_name'] = {title: region_name.text(), id: region_name.val()};
                          }
                       }

                       data = JSON.stringify(data);
                       $('#' + field_id).val('' + data + '');
                   }
               });
               
               var shapefile = null;
               
               $('#draw-shapefile').click(function(){
                   
                    $('#upload-shape').hide(0, function(){
                       $('#upload_spinner').show(0);
                    });
                    if(shapefile == null) {
                        alert('You must add a shapefile using the file select dialog.');
                          $('#upload_spinner').hide(0, function(){
                             $('#upload-shape').show(0);
                          });
                    } else if(shapefile.size > 0) {
        			    // Check for the various File API support.
                        if (window.File && window.FileReader && window.FileList && window.Blob) {

                            var reader = new FileReader();

                            reader.onload = function(e) {
                                var arrayBuffer = reader.result;
                                
                                shp(arrayBuffer).then(function(geojson){
                                    // clear layer
                                    constraintsLayer.getSource().clear();
                                    
                					var features = (new ol.format.GeoJSON()).readFeatures(geojson, {
                                        featureProjection: 'EPSG:3857'
                                    });
                                    
                                    // loop through all features, calculating group extent (could also transform bbox)
                                    // add ID and set style to each
                                    var extent = features[0].getGeometry().getExtent().slice(0);
                                    $.each(features, function(i,feature){ 
                                        
                                        ol.extent.extend(extent,feature.getGeometry().getExtent());
                                        
                                        feature.setId('geo_constraints_'+i);
                                        
                                        var styles = {
                                            'MultiPolygon': new ol.style.Style({
                                                fill: new ol.style.Fill({
                                                    color: 'rgba(0, 160, 228, 0.1)'
                                                }),
                                                stroke: new ol.style.Stroke({
                                                    color: 'rgba(0, 160, 228, 0.9)',
                                                    width: 2
                                                })
                                            }),
                                            'Polygon': new ol.style.Style({
                                                fill: new ol.style.Fill({
                                                    color: 'rgba(0, 160, 228, 0.1)'
                                                }),
                                                stroke: new ol.style.Stroke({
                                                    color: 'rgba(0, 160, 228, 0.9)',
                                                    width: 2
                                                })
                                            })
                                        }
                                        
                                        feature.setStyle(styles[feature.getGeometry().getType()]);
                                    });
                                    
                                    constraintsLayer.getSource().addFeatures(features);
                             
                                    map.getView().fit(extent, {size: map.getSize(), padding: [50,50,50,50]});
                                    
                                    $('#upload_spinner').hide(0, function(){
                                       $('#upload-shape').show(0);
                                    });
                                });
                            }
                            
                            reader.readAsArrayBuffer(shapefile);
                                                      
                        } else {
                          alert('The File APIs are not fully supported in this browser.');
                          $('#upload_spinner').hide(0, function(){
                             $('#upload-shape').show(0);
                          });
                        }
        				
                       
        			} else {
        			    alert('You must add a shapefile using the file select dialog.')
        			}
               });
               
               $("#upload_file").change(function(evt) {
                   shapefile = evt.target.files[0];
        	   });
        	   
        	   $('#remove-shapefile').click(function(){
        	       $('#upload_file').val('');
        	       shapefile = null;
        	   });
               
           },
           /************************************************
            * get a proj4 projection object for wkt or
            * fall back to epsg code (which may be a default value).
            * returns null in case proj4 can't create a projection
            * for either.
            */
           getProj4(epsg, wkt) {
               try {
                   return proj4(wkt);
               } catch (error) {
               }
               try {
                   return proj4(epsg);
               } catch (error) {
                   return null;
               }
           },

           /************************************************
            * project extent from crs to crs, and clip
            * given extent to extent of from crs
            */
           transformExtent: function(extent, fromcrs, tocrs, fromwkt) {
               var proj = bccvl_common.getProj4(fromcrs, fromwkt);
               var toproj = bccvl_common.getProj4(tocrs, null);

               if (!proj || !toproj) {
                   // no matching projection, we don't know how to transform the extent
                   // so return epsg3857 extent and fit to whole world
                   return [-20026376.39, -20048966.10, 20026376.39, 20048966.10];
               }

               // Clip the extent to epsg 3857
               if (tocrs == "EPSG:3857") {
                  extent[1] = Math.max(extent[1], -85.06);
                  extent[3] = Math.min(extent[3], 85.06);
                  extent[0] = Math.max(extent[0], -179.99);
                  extent[2] = Math.min(extent[2], 179.99);
               }

               var center = ol.extent.getCenter(extent);
               // build list of coordinates
               // include center coordinates to make sure we include coordinates
               // that may lie outside of corner bounds (e.g. albers -> pseudo mercator)
               var coordinates = [
                   ol.extent.getBottomLeft(extent),
                   ol.extent.getBottomRight(extent),
                   ol.extent.getTopRight(extent),
                   ol.extent.getTopLeft(extent),
                   // add center coordinate pairs
                   // bottom center
                   [extent[0], center[1]],
                   // top center
                   [extent[2], center[1]],
                   // center left
                   [center[0], extent[1]],
                   // center right
                   [center[0], extent[3]]
               ];
               // transform all coordinate pairs
               coordinates = coordinates.map(function(coord) {
                   return proj4(proj, toproj).forward(coord);
               });
               // build extent
               var ret = ol.extent.boundingExtent(coordinates);

               // check ret
               if (ret.some(function(el) { return !isFinite(el) })) {
                   // some elements are out of range
                   // return full extent of target crs
                   return ol.proj.get(tocrs).getExtent();
               }
               // should be all good now
               return ret;
           },

           drawBBoxes: function(map, geometries, bboxLayer) {

               // clear any existing features
               bboxLayer.getSource().clear();

               geometries.forEach(function(geometry) {
                   var style;

                    if (geometry.type == "DataGenreTraits"){
                        bccvl_common.addLayerLegend(map.getTarget(), 'Traits Occurrences', 'rgba(52, 73, 94, 0.9)', null, null);
                        var style = new ol.style.Style({
                           fill: new ol.style.Fill({
                               color: 'rgba(52, 73, 94, 0.2)'
                           }),
                           stroke: new ol.style.Stroke({
                               color: 'rgba(52, 73, 94, 0.9)',
                               width: 2
                           })
                       });
                    } else if (geometry.type == "DataGenreCC" || geometry.type == "DataGenreE"){
                        bccvl_common.addLayerLegend(map.getTarget(), 'Climate/Env. Dataset', 'rgba(46, 204, 113, 0.9)', null, null);
                        var style = new ol.style.Style({
                           fill: new ol.style.Fill({
                               color: 'rgba(46, 204, 113, 0.2)'
                           }),
                           stroke: new ol.style.Stroke({
                               color: 'rgba(46, 204, 113, 0.9)',
                               width: 2
                           })
                       });
                    }

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


                   feature.setStyle(style);

                   bboxLayer.getSource().addFeature(feature);

               });

               map.getView().fit(bboxLayer.getSource().getExtent(), {size: map.getSize()});

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
           renderCSV: function(uuid, url, id, params){
               console.log(id);
               console.log('blah');
               // NEED TO DESTROY ANY EXISTING MAP OR HTML
               var container = $('#'+id);
              // if (container.hasClass('active')) {
                   container.empty();
                   map = null;
              // }

               var readAndRender = function(data){
                    var rowData = d3.csvParse(data),
                        columns = rowData.columns;

                    delete rowData.columns;

                    var table = d3.select("#"+id).append("table"),
                        thead = table.append("thead"),
                        tbody = table.append("tbody");

                    table.classed('table table-striped', true);

                    // Append the header row
                    thead.append("tr")
                        .selectAll("th")
                        .data(columns)
                        .enter()
                        .append("th")
                            .text(function(column) {
                                return column;
                            });

                    // Create a row for each object in the data
                    var rows = tbody.selectAll("tr")
                        .data(rowData)
                        .enter()
                        .append("tr");

                    // Create a cell in each row for each column
                    var cells = rows.selectAll("td")
                        .data(function(row) {
                            return columns.map(function(column) {

                                // check if value is a number
                                // round to 3 decimal places if so
                                var val = row[column];
                                var parsed = Number.parseFloat(val);
                                var notNumber = Number.isNaN(parsed);

                                if (! notNumber && column.toUpperCase() != 'DATE'){
                                    val = parsed.toFixed(3);
                                }
                                return {
                                    column: column,
                                    value: val
                                };
                            });
                        })
                        .enter()
                        .append("td")
                            .text(function(d) { return d.value; });
                }

               if (params.mimetype == 'application/zip') {
                   console.log('get metadata');
                   // request metadata about file
                   var requestStatus = $.Deferred();
                   var jqxhr = $.Deferred();

                   bccvlapi.visualiser.fetch(
                       {
                           'datasetid': uuid,
                           'DATA_URL': url,
                           'INSTALL_TO_DB': false
                       }
                   ).then(
                       function(status) {
                            return bccvlapi.dm.metadata(uuid, root=true)
                        },
                        function(jqXHR, textStatus, errorThrown){
                            alert('Problem preparing dataset for viewing, please try again later.')
                        }
                   ).then(
                       function(data, status, jqXHR) {  

                           // Extract occurrence dataset from zip file
                           zip.useWebWorkers = false;
                           var httpReader = new zip.HttpReader(data.file);
                           var zipReader = zip.createReader(
                               httpReader,
                               function(reader) {
                                   // get all entries from the zip
                                   reader.getEntries(function(entries) {

                                       for (var i = 0; i < entries.length; i++) {
                                           if (entries[i].filename.includes('citation')) {
                                               continue;
                                           }

                                           entries[i].getData(new zip.TextWriter(), function(data) {
                                               readAndRender(data);
                                           });
                                       }

                                   });

                               },
                               function(error) {
                                   // onerror callback
                                   console.log(error);
                                   throw error;
                               }
                           );
                       }
                    );
                } else {
                    $.ajax(url).then(
                        function(data) {
                            readAndRender(data);
                        },
                        function(jqXHR, textStatus, errorThrown) {
                            if (jqXHR.status == 0) {
                                container.html('Your browser does not support cross-domain-origin requests. This can be fixed by updating or using another browser.');
                            } else {
                                container.html('<pre>Problem loading data. Please try again later.</pre>').addClass('active');
                            }
                        }
                    );
                }

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
