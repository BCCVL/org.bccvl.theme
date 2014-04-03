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

            $("#wrapper-basic .btn-success").attr('disabled', 'disabled');
            $("#wrapper-aaf a").attr('onclick','return false;');

            $("#legals-checkbox:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("#wrapper-basic .btn-success").removeAttr("disabled");
                    
                    $("#wrapper-aaf a").removeAttr('onclick');
                    $("#wrapper-aaf a").css('cursor', 'pointer');

                }
                else {
                    $("#wrapper-basic .btn-success").attr('disabled', 'disabled');
                    $("#wrapper-aaf a").attr('onclick','return false;');
                    $("#wrapper-aaf a").css('cursor', 'default');
                }
            })

        });
    // ==============================================================
    }
);