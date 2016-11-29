
// JS code to initialise the visualiser map

define(['jquery', 'openlayers3', 'ol3-layerswitcher', 'bccvl-visualiser-common', 'prism', 'jquery-xmlrpc'],
    function( $, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        // new list layout events
        $('body').on('click', '.bccvl-list-occurrence-viz, .bccvl-list-absence-viz', function(event){
            event.preventDefault();
            var params = {
                'type': 'occurrence',
                'mimetype': $(this).data('mimetype')
            }
            vizcommon.mapRender($(this).data('uuid'), $(this).attr('href'), 'map-'+$(this).data('uuid')+'', params);
        });

        $('body').on('click', 'a.bccvl-list-auto-viz', function(event){
            event.preventDefault();
            var params = {
                'type': 'auto',
                'mimetype': $(this).data('mimetype')
            }
            vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), 'map-'+$(this).data('uuid')+'', params, $(this).data('viz-layer'));
        });

        // older events (still in use on experiment pages and a few others)
        $('body').on('click', '.bccvl-occurrence-viz, .bccvl-absence-viz', function(event){
            event.preventDefault();
            var params = {
                'type': 'occurrence',
                'mimetype': $(this).data('mimetype')
            }
            vizcommon.mapRender($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), params);
        });

        $('body').on('click', 'a.bccvl-auto-viz', function(event){
            event.preventDefault();
            var params = {
                'type': 'auto',
                'mimetype': $(this).data('mimetype')
            }

            if (params.mimetype == 'image/geotiff'){
                vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), params, $(this).data('viz-layer'));
            } else if (params.mimetype == 'image/png'){
                vizcommon.renderPng($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (params.mimetype == 'text/csv'){
                vizcommon.renderCSV($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (params.mimetype == 'text/x-r-transcript' || params.mimetype ==  'application/json' || params.mimetype == 'text/plain' || params.mimetype == 'text/x-r' || params.mimetype == 'application/x-perl') {
                vizcommon.renderCode($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (params.mimetype == 'application/pdf') {
                vizcommon.renderPDF($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (params.mimetype == 'application/zip') {
                vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), params, $(this).data('viz-layer'));                
            }
        });
        
        $('body').on('click', 'a.bccvl-biodiverse-viz', function(event){
            event.preventDefault();
            var params = {
                'type': 'biodiverse',
                'mimetype' : $(this).data('mimetype'),
                'srs' : $(this).data('srs'), 
                'cellsize' : $(this).data('cellsize')
            }
            
            if ($(this).data('mimetype') == 'text/csv'){
                vizcommon.mapRender($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), params, $(this).data('viz-layer') );
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
        
    }
);
