
// JS code to initialise the visualiser map

define(['jquery', 'bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'bccvl-visualiser-common', 'prism', 'jquery-csvtotable', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        // new list layout events
        $('body').on('click', '.bccvl-list-occurrence-viz, .bccvl-list-absence-viz', function(event){
            event.preventDefault();
            vizcommon.mapRender($(this).data('uuid'), $(this).attr('href'), 'map-'+$(this).data('uuid')+'', 'occurence');
        });

        $('body').on('click', 'a.bccvl-list-auto-viz', function(event){
            event.preventDefault();
            vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), 'map-'+$(this).data('uuid')+'', 'auto', $(this).data('viz-layer'));
        });

        // older events (still in use on experiment pages and a few others)
        $('body').on('click', '.bccvl-occurrence-viz, .bccvl-absence-viz', function(event){
            event.preventDefault();
            vizcommon.mapRender($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'occurence');
        });

        $('body').on('click', 'a.bccvl-auto-viz', function(event){
            event.preventDefault();
            var type = $(this).data('mimetype');

            if (type == 'image/geotiff'){
                vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));
            } else if (type == 'image/png'){
                vizcommon.renderPng($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/csv'){
                vizcommon.renderCSV($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'text/x-r-transcript' || type ==  'application/json' || type == 'text/plain' || type == 'text/x-r' || type == 'application/x-perl') {
                vizcommon.renderCode($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/pdf') {
                vizcommon.renderPDF($(this).data('uuid'), $(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'));
            } else if (type == 'application/zip') {
                vizcommon.mapRender($(this).data('uuid'),$(this).attr('href'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));                
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
