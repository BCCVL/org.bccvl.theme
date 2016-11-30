
// JS code to initialise the visualiser map

define(['jquery', 'bccvl-visualiser-common'],
    function( $, vizcommon  ) {

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
                var label = [$(this).data('species'), $(this).data('algorithm')]
                    .filter(function(n){return n != undefined})
                    .join(" - ");
                $('#minigraph_'+$(this).data('uuid')).append('<label>'+$(this).data('layername')+'<br/> (<em>'+label+'</em>)</label>');
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
