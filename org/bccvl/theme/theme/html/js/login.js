//
// main JS for the login page.
//
define(     ['jquery', 'bootstrap'],
    function( $) {
    // ==============================================================
        $(function() {
            console.log('login page behaviour loaded.');

            $('#login-aaf').click(function(e) {
                $(this).addClass('active');
                $('#login-basic').removeClass('active');
            	$('#wrapper-basic').addClass('hidden');
            	$('#wrapper-aaf').removeClass('hidden');
                $('.disclaimer.legals').appendTo('#wrapper-aaf');
            });

            $('#login-basic').click(function(e) {
                $(this).addClass('active');
                $('#login-aaf').removeClass('active');
            	$('#wrapper-basic').removeClass('hidden');
            	$('#wrapper-aaf').addClass('hidden');
                $('.disclaimer.legals').insertBefore('#login-form .formControls');
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
            });

            $("#wrapper-aaf a").click(function() {
                if ( !($("#legals-checkbox:checkbox").is(":checked")) )
                    alert("Please agree to the terms and conditions to login.");
            });
        });
    // ==============================================================
    }
);