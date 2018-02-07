//
// main JS for the login page.
//
define(
    ['jquery', 'bootstrap2'],
    function( $) {
        // ==============================================================
        $(function() {
            console.log('homepage scripts loaded.');

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

            $( window ).resize(function() {
                $(this).css('width', $(this).parent().innerWidth());
                $(this).css('height', ( ($(this).parent().innerWidth()/16) * 9 ));
            });
        });
        // ==============================================================
    }
);
