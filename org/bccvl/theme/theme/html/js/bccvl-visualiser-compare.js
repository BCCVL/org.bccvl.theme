
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            $('.bccvl-preview-pane:visible').append('<div class="minimap" id="minimap_'+$(this).data('uuid')+'"></div>');
            var viztype = $(this).data('viz-type') || 'auto';
            renderNewMap($(this).data('uuid'),$(this).attr('href'), 'minimap_'+$(this).data('uuid'), viztype, $(this).data('layername'), $(this).data('algorithm'));
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();
            var uuid = $(this).data('uuid');
            $('#minimap_'+uuid).remove();
            $.each(maps, function(i, map){
                if (map.uuid == uuid){
                    delete $(this);
                }
            });
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
            }

            // destroy any floating progress bars (should be destroyed above, this is a fallback)
            $('#progress-'+id).remove();

            $.when(vizcommon.renderBase(id)).then(function(map, visLayers) {

                $.when(vizcommon.addLayersForDataset(uuid, id, undefined, visLayers)).then(function(newLayers) {
                    // FIXME: assumes there is only 1 layer
                    var newLayer = newLayers[0];
                    var layerdef = newLayers.get('bccvl').layer;
                    // set layer title and opacity
                    if (typeof algorithm != "undefined") {
                        container.append('<label>'+layerdef.title+'<br/> (<em>'+algorithm+'</em>)</label>');
                    } else {
                        container.append('<label>'+layerdef.title+'<br/></label>');
                    }

                    newLayer.setOpacity(0.9);

                    // updat extent on event?
                    if( newLayer.getExtent() ){
                          
                        if ( visLayers.getExtent() ){
                            
                            ol.extent.extend( visLayers.getExtent(), newLayer.getExtent() );
                            map.getView().fit(visLayers.getExtent(), map.getSize(), {padding:[20,20,20,20]});
                        } else {
                            
                            visLayers.setExtent(newLayer.getExtent());
                            map.getView().fit(visLayers.getExtent(), map.getSize(), {padding:[20,20,20,20]});
                        }
                    } 
                    
                });
                
                map.uuid = uuid;
                maps.push(map);

                bindMaps();
                
            });
            
            
            function bindMaps(){
                var leader = maps[0];
                $.each(maps, function(i, map){
                    if (i>0){
                        // BindTo removed somewhere between OL3.4.x and OL3.7.0
                        //map.bindTo('view', leader);
                        map.setView(leader.getView());
                    }
                });
            }
            
        }
        
    }
);
