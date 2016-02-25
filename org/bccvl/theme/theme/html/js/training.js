//
// main JS for the training page.
//
define(     ['jquery', 'bootstrap2'],
    function( $) {
    // ==============================================================
        $(function() {
            // nothing to do so far.
            console.log('training page behaviour loaded.')

             // delay iframe loading until after document is ready, resize on parent
            var iHeight;
            var iWidth; 

            $('iframe').each(function(i){
                $(this).attr('src',$(this).data('src'));
                if (i == 0){
                    iHeight = $(this).parent().innerWidth();
                    iWidth = ( ($(this).parent().innerWidth()/16) * 9 )
                }
                $(this).css('width', iHeight);
                $(this).css('height', iWidth);
            });

            $('.next-button').click(function(){
                var tabNo = $(this).parents('.tab-pane').index();
                var nextTab = $(this).parents('.tab-content').find('.tab-pane').eq(tabNo+1).attr('id');
                $('a[href="#'+nextTab+'"]').tab('show');
            });
            $('.prev-button').click(function(){
                console.log('prev');
                var tabNo = $(this).parents('.tab-pane').index();
                var prevTab = $(this).parents('.tab-content').find('.tab-pane').eq(tabNo-1).attr('id');
                $('a[href="#'+prevTab+'"]').tab('show');
            });
        });
    // ==============================================================
    }
);
