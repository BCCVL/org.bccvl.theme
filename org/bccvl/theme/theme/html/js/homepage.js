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
            $('iframe').each(function(){
                $(this).attr('src',$(this).data('src'));
                $(this).css('width', $(this).parent().innerWidth());
                $(this).css('height', ( ($(this).parent().innerWidth()/16) * 9 ));
            });

            $( window ).resize(function() {
                $(this).css('width', $(this).parent().innerWidth());
                $(this).css('height', ( ($(this).parent().innerWidth()/16) * 9 ));
            });
        });
        // ==============================================================
    }
);
