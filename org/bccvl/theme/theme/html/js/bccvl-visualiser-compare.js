
// JS code to initialise the visualiser map

define(['jquery', 'bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'bccvl-visualiser-common', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            $('.bccvl-preview-pane:visible').append('<div class="minimap" id="minimap_'+$(this).data('uuid')+'"></div>');
            var viztype = $(this).data('viz-type') || 'auto';
            var label = [$(this).data('species'), $(this).data('algorithm')]
                .filter(function(n){return n != undefined})
                .join(" - ");
            renderNewMap($(this).data('uuid'),$(this).attr('href'), 'minimap_'+$(this).data('uuid'), viztype, $(this).data('layername'), label);
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();
            var uuid = $(this).data('uuid');
            $('#minimap_'+uuid).remove();
            // iterate reverse over maps and remove correct one
            var idx = maps.length;
            while (idx--) {
                if (maps[idx].uuid == uuid) {
                    maps.splice(idx, 1);
                }
            }
            //delete window.maps[uuid];  
            $(this).removeClass('bccvl-remove-viz').addClass('bccvl-compare-viz');
            $(this).find('i').removeClass('icon-eye-close').addClass('icon-eye-open');
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        var maps = [];
        
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
                maps = [];
            }

            // destroy any floating progress bars (should be destroyed above, this is a fallback)
            $('#progress-'+id).remove();

            $.when(vizcommon.renderBase(id)).then(function(map, visLayers) {

                $.when(vizcommon.addLayersForDataset(uuid, url, id, undefined, visLayers)).then(function(newLayers) {
                    // FIXME: assumes there is only 1 layer
                    var newLayer = newLayers[0];
                    var layerdef = newLayer.get('bccvl').layer;
                    // set layer title and opacity
                    if (typeof algorithm != "undefined") {
                        container.append('<label>'+layerdef.title+'<br/> (<em>'+algorithm+'</em>)</label>');
                    } else {
                        container.append('<label>'+layerdef.title+'<br/></label>');
                    }

                    newLayer.setOpacity(0.9);

                    // if it is the first map, zoom to extent
                    if (maps.length == 1) {
                        if ( visLayers.getExtent() ){
                            
                            ol.extent.extend( visLayers.getExtent(), newLayer.getExtent() );
                            map.getView().fit(visLayers.getExtent(), map.getSize(), {padding:[20,20,20,20]});
                        } else {
                            
                            visLayers.setExtent(newLayer.getExtent());
                            map.getView().fit(visLayers.getExtent(), map.getSize(), {padding:[20,20,20,20]});
                        }
                    }
                    
                });

                // let all maps use the same view
                if (maps.length != 0) {
                    map.setView(maps[0].getView());
                }
                
                map.uuid = uuid;
                maps.push(map);

            });
            
        }
        
    }
);
