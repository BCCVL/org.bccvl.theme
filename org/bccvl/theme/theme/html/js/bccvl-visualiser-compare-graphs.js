
// JS code to initialise the visualiser map

define(['jquery', 'bccvl-preview-layout', 'bccvl-visualiser-common', 'jquery-xmlrpc'],
    function( $, preview, vizcommon  ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        $('body').on('click', 'a.bccvl-compare-graph', function(event){
            event.preventDefault();
            $('.bccvl-preview-pane:visible').append('<div class="minimap graph" id="minigraph_'+$(this).data('uuid')+'"></div>');
            var type = $(this).data('mimetype');

            if (type == 'image/png'){
                vizcommon.renderPng($(this).data('uuid'), $(this).attr('href'), 'minigraph_'+$(this).data('uuid'));
            } 
            if (typeof $(this).data('algorithm') !== 'undefined') {
                $('#minigraph_'+$(this).data('uuid')).append('<label>'+$(this).data('layername')+'<br/> (<em>'+$(this).data('algorithm')+'</em>)</label>');
            } else {
                $('#minigraph_'+$(this).data('uuid')).append('<label>'+$(this).data('layername')+'</label>');
            }
            

            $(this).removeClass('bccvl-compare-graph').addClass('bccvl-remove-graph');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-graph', function(event){
            event.preventDefault();
            var uuid = $(this).data('uuid');
            $('#minigraph_'+uuid).remove();

            $(this).removeClass('bccvl-remove-graph').addClass('bccvl-compare-graph');
            $(this).find('i').removeClass('icon-eye-close').addClass('icon-eye-open');
            
        });
        
    }
);
