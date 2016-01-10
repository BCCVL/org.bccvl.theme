
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
                renderPng($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/csv'){
                renderCSV($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/x-r-transcript' || type ==  'application/json' || type == 'text/plain' || type == 'text/x-r' || type == 'application/x-perl') {
                renderCode($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/pdf') {
                renderPDF($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
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
                    // map ... the map generated
                    // visLayers ... an empty layer group
                    // get base layer group and add Satelite Tile layer
                    map.getLayers().item(0).getLayers().push(
                        new ol.layer.Tile({
                            title: 'Satellite',
                            type: 'base',
                            visible: false,
                            source: new ol.source.MapQuest({layer: 'sat'})
                        })
                    );
                    
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
            },
        };

        // RENDER PNG IMAGES
        function renderPng(uuid, url, id) {
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }
            container.height('auto').html('<img src="'+url+'" alt="" />').addClass('active');
        };

        // RENDER CODE
        function renderCode(uuid, url, id) {
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
                error: function() {
                    container.html('<pre>Problem loading data. Please try again later.</pre>');
                }
            });
        };

        // RENDER CSV
        function renderCSV(uuid, url, id) {
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
                    error: function() {
                        container.html('<pre>Problem loading data. Please try again later.</pre>').addClass('active');
                    }
                });
        };

        function renderPDF(uuid, url, id) {
            // NEED TO DESTROY ANY EXISTING MAP OR HTML
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }
            container.html('<object type="application/pdf" data="' + url + '" width="100%" height="810px"></object>');
        };

        return render;       

    }
);
