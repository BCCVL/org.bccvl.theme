
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'prism', 'jquery-csvtotable', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        // new list layout events
        $('body').on('click', '.bccvl-list-occurrence-viz, .bccvl-list-absence-viz', function(event){
            event.preventDefault();
            render.mapRender($(this).data('uuid'), $(this).attr('href'), 'map-'+$(this).data('uuid')+'', 'occurence');
        });

        $('body').on('click', 'a.bccvl-list-auto-viz', function(event){
            event.preventDefault();
            render.mapRender($(this).data('uuid'),$(this).attr('href'), 'map-'+$(this).data('uuid')+'', 'auto', $(this).data('viz-layer'));
        });

        // older events (still in use on experiment pages and a few others)
        $('body').on('click', '.bccvl-occurrence-viz, .bccvl-absence-viz', function(event){
            event.preventDefault();
            render.mapRender($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'occurence');
        });

        $('body').on('click', 'a.bccvl-auto-viz', function(event){
            event.preventDefault();
            var type = $(this).data('mimetype');

            if (type == 'image/geotiff'){
                render.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));
            } else if (type == 'image/png'){
                vizcommon.renderPng($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/csv'){
                vizcommon.renderCSV($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/x-r-transcript' || type ==  'application/json' || type == 'text/plain' || type == 'text/x-r' || type == 'application/x-perl') {
                vizcommon.renderCode($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/pdf') {
                vizcommon.renderPDF($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/zip') {
                render.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));                
            }
        });

        // setup popover handling for bccvl-preview-pane
        $('.bccvl-preview-pane').popover({
            'selector': '[data-toggle="popover"]',
            'trigger': 'hover'
        }).on('shown', function(e) { // prevent events from bubbling up to modal
            e.stopPropagation();
        }).on('hidden', function(e) {
            e.stopPropagation();
        });
        

        /* Global configuration */
        // ----------------------------------------------------------------
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        var map;
                        
        var render = {
            // RENDER DATA LAYERS
            // -------------------------------------------------------------------------------------------
            mapRender: function(uuid, url, id, type, visibleLayer) {
                // CREATE BASE MAP
                // -------------------------------------------------------------------------------------------
                // TODO: wrapping in when not necessary?
                $.when(vizcommon.renderBase(id)).then(function(map, visLayers) {

                    // add layerswitcher
                    var layerSwitcher = new ol.control.LayerSwitcher({
                        toggleOpen: true,
                        singleVisibleOverlay: true
                    });
                    map.addControl(layerSwitcher);
                    layerSwitcher.showPanel();

                    // load and add layers to map
                    vizcommon.addLayersForDataset(uuid, id, visibleLayer, visLayers).then(function(newLayers) {
                        $.each(newLayers, function(index, newLayer) {
                            // if layer is visible we have to show legend as well
                            if (newLayer.getVisible()) {
                                $('#'+id+' .ol-viewport .ol-overlaycontainer-stopevent').append(newLayer.get('bccvl').legend);
                                // zoom to extent to first visible layer
                                if(newLayer.getExtent()){
                                    map.getView().fit(newLayer.getExtent(), map.getSize());
                                }
                            }
                            
                        });
                    });
                    
                    // add click control for point return
                    map.on('singleclick', function(evt){
                        vizcommon.getPointInfo(evt);
                    });
                    
                    map.on('pointermove', function(evt) {
                        vizcommon.hoverHandler(evt);
                    });
                            
                });
            }
        };

        return render;       

    }
);
