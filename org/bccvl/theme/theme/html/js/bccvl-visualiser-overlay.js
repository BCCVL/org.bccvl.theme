
// JS code to initialise the visualiser map

define(['jquery', 'openlayers3', 'ol3-layerswitcher', 'bccvl-visualiser-common'],
    function( $, ol, layerswitcher, vizcommon  ) {

        var select;
        /* Global configuration */
        // ----------------------------------------------------------------
        var map;
        var visLayers;
        
        var mapId = $('.bccvl-preview-pane:visible').attr('id');

        $(function () {
            var base_map = vizcommon.renderBase(mapId)
            map = base_map.map
            visLayers = base_map.visLayers
            
            // add layerswitcher
            var layerSwitcher = new ol.control.LayerSwitcher({
                toggleOpen: true,
                singleVisibleOverlay: false
            });
            
            map.addControl(layerSwitcher);
            
            vizcommon.createLegendBox(mapId);
            appendBlendControl(mapId);
            // tie up blend control
            select = document.getElementById('blend-mode');
            // Rerender map when blend mode changes
            select.addEventListener('change', function() {
                map.render();
            });

        });

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            var viztype = $(this).data('viz-type') || 'auto';
            addNewLayer($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), viztype, $(this).data('layername'), $(this).data('subset'), $(this).data('algorithm'), $(this).data('species'));
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();

            var uuid = $(this).data('uuid');
            var colorName = $('.olLegend label[data-uuid="'+uuid+'"]').data('color-name');

            visLayers.getLayers().forEach(function (lyr) {
                if (lyr.get('uuid') == uuid){
                    visLayers.getLayers().remove(lyr);
                }          
            });

            $.each(usedStyleArray, function(i){
                if($(this)[0].name == colorName){
                    styleArray.unshift(usedStyleArray[i]);
                    usedStyleArray.splice(i,1);
                }
            });

            $('.olLegend label[data-uuid="'+uuid+'"]').remove();
            $(this).removeClass('bccvl-remove-viz').addClass('bccvl-compare-viz');
            $(this).find('i').removeClass('icon-eye-close').addClass('icon-eye-open');
        });

        var styleArray = [
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:139,g:208,b:195},
              "endpoint": {r:18,g:157,b:133},
              "name":'aquaGreen'
            },
            { "minVal": 0,"maxVal" :1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:233,g:170,b:129},
              "endpoint": {r:210,g:96,b:19},
              "name":'redOrange'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:255,g:172,b:236},
              "endpoint": {r:247,g:108,b:215},
              "name":'magenta'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:248,g:225,b:135},
              "endpoint": {r:241,g:196,b:15},
              "name":'yellowOrange'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:198,g:162,b:214},
              "endpoint": {r:143,g:76,b:176},
              "name":'purple'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:154,g:164,b:175},
              "endpoint": {r:48,g:71,b:94},
              "name":'darkNavy'
            },  
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:151,g:229,b:184},
              "endpoint": {r:45,g:195,b:108},
              "name":'brightGreen'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:154,g:203,b:237},
              "endpoint": {r:47,g:150,b:220},
              "name":'brightBlue'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:223,g:156,b:149},
              "endpoint": {r:192,g:57,b:43},
              "name":'deepRed'
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:154,g:154,b:154},
              "endpoint":{r:47,g:47,b:47},
              "name":'black'
            }
        ];

        var usedStyleArray = [];

        // Various helper methods and event handlers

        /**
         * This method sets the globalCompositeOperation to the value of the select
         * field and it is bound to the precompose event of the layers.
         *
         * @param {ol.render.Event} evt The render event.
         */
        function setBlendModeFromSelect(evt) {
          evt.context.globalCompositeOperation = select.value;
        };


        /**
         * This method resets the globalCompositeOperation to the default value of
         * 'source-over' and it is bound to the postcompose event of the layers.
         *
         * @param {ol.render.Event} evt The render event.
         */
        function resetBlendModeFromSelect(evt) {
          evt.context.globalCompositeOperation = 'darken';
        };


        /**
         * Bind the pre- and postcompose handlers to the passed layer.
         *
         * @param {ol.layer.Vector} layer The layer to bind the handlers to.
         */
        function bindLayerListeners(layer) {
          layer.on('precompose', setBlendModeFromSelect);
          layer.on('postcompose', resetBlendModeFromSelect);
        };


        /**
         * Unind the pre- and postcompose handlers to the passed layers.
         *
         * @param {ol.layer.Vector} layer The layer to unbind the handlers from.
         */
        function unbindLayerListeners(layer) {
          layer.un('precompose', setBlendModeFromSelect);
          layer.un('postcompose', resetBlendModeFromSelect);
        };


        function appendBlendControl(id){
            $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append('<div class="ol-unselectable ol-control ol-blend-control">'+
                        '<label for="blend-mode" class="mode">Mode: </label>'+
                        '<select id="blend-mode" class="form-control" >'+
                            '<optgroup label="Common">'+
                                '<option selected>darken (default)</option>'+
                                '<option>lighten</option>'+
                                '<option>source-over</option>'+
                            '</optgroup>'+
                            '<optgroup label="Experimental">'+
                                '<option>source-in</option>'+
                                '<option>source-out</option>'+
                                '<option>source-atop</option>'+
                                '<option>destination-over</option>'+
                                '<option>destination-in</option>'+
                                '<option>destination-out</option>'+
                                '<option>destination-atop</option>'+
                                '<option>lighter</option>'+
                                '<option>copy</option>'+
                                '<option>xor</option>'+
                                '<option>multiply</option>'+
                                '<option>screen</option>'+
                                '<option>overlay</option>'+
                                '<option>color-dodge</option>'+
                                '<option>color-burn</option>'+
                                '<option>hard-light</option>'+
                                '<option>soft-light</option>'+
                                '<option>difference</option>'+
                                '<option>exclusion</option>'+
                                '<option>hue</option>'+
                                '<option>saturation</option>'+
                                '<option>color</option>'+
                                '<option>luminosity</option>'+
                            '</optgroup>'+
                        '</select>'+
                    '</div>');
        }

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function addNewLayer(uuid, url, id, type, layerName, algo, species){

            var numLayers = visLayers.getLayers().getLength();

            if (numLayers > 9) {
                alert('This interface supports a maximum of ten layers, please remove a layer before adding another.');
                return;
            } 

            vizcommon.addLayersForDataset(uuid, url, id, undefined, visLayers).then(
                function(newLayers) {
                    // TODO: rendering legend should be an option or has to happen outside of addLayersForDataset
                    // FIXME: assumes there is only one layer
                    var newLayer = newLayers[0];
                    var layerdef = newLayer.get('bccvl').layer;

                    if (layerdef.type == 'occurrence') {
                        vizcommon.addLayerLegend(id, layerName, 'occurrence', uuid);
                        newLayer.setOpacity(1);                    
                    } else {
                        // copy color range from our styleArray
                        layerdef.style.startpoint = styleArray[0].startpoint;
                        layerdef.style.midpoint = styleArray[0].midpoint;
                        layerdef.style.endpoint = styleArray[0].endpoint;
                        
                        // add metadata to layer title for legend.
                        if (typeof algo !== "undefined" && typeof species !== "undefined") {
                            layerdef.title = layerdef.title + ' ('+species+' - '+algo+')';
                        }
                        
                        // TODO: this does not update legend
                        newLayer.getSource().getParams().SLD_BODY = vizcommon.generateSLD(layerdef);
                        
                        // handle our own legend
                        vizcommon.addLayerLegend(id, layerdef.title, styleArray[0].endpoint, uuid, styleArray[0].name);
                        
                        // move used color into used array
                        usedStyleArray.push(styleArray[0]);
                        styleArray.shift();
                        
                    }
                    bindLayerListeners(newLayer);
                }
            );
        }
    }

);
