//
// main JS for the login page.
//
define(     ['jquery', 'bootstrap'],
    function( $) {
    // ==============================================================
        $(function() {
            console.log('login page behaviour loaded.');

            $('#login-aaf').click(function(e) {
            	$('#wrapper-basic').addClass('hidden');
            	$('#wrapper-aaf').removeClass('hidden');
            });

            $('#login-basic').click(function(e) {
            	$('#wrapper-basic').removeClass('hidden');
            	$('#wrapper-aaf').addClass('hidden');
            });
        });
    // ==============================================================
    }
);