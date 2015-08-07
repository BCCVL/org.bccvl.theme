//
// main JS for the login page.
//
define(
    ['jquery', 'bootstrap'],
    function( $) {
        // ==============================================================
        $(function() {
            console.log('login page behaviour loaded.');
            $('.disclaimer.legals').insertBefore('.aaf-logo-link');

            $('#wrapper-basic').append('<p>Need to request an account? <a href="http://www.bccvl.org.au/request-a-local-login-account" target="_blank">Click here.</a></p>');

            $('#login-aaf').click(function(e) {
                $(this).addClass('active');
                $('#login-basic').removeClass('active');
            	$('#wrapper-basic').addClass('hidden');
            	$('#wrapper-aaf').removeClass('hidden');
                $('.disclaimer.legals').insertBefore('.aaf-logo-link');
                if( $('#legals-checkbox').prop('checked') == true ){
                    $('.aaf-logo-link').attr('disabled',false);
                } else {
                    $('.aaf-logo-link').attr('disabled',true);
                }
            });

            $('#login-basic').click(function(e) {
                $(this).addClass('active');
                $('#login-aaf').removeClass('active');
            	$('#wrapper-basic').removeClass('hidden');
            	$('#wrapper-aaf').addClass('hidden');
                $('.disclaimer.legals').insertBefore('#login-form .formControls');
                if( $('#legals-checkbox').prop('checked') == true ){
                    $('#login-form input[type="submit"]').attr('disabled',false);
                } else {
                    $('#login-form input[type="submit"]').attr('disabled',true);
                }
            });

            $("#wrapper-basic .btn-success, #wrapper-aaf .btn-success").attr('disabled', 'disabled');
            //$("#wrapper-aaf a").attr('onclick','return false;');

            $("#legals-checkbox:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("#wrapper-basic .btn-success, #wrapper-aaf .btn-success").removeAttr("disabled");

                    $("#wrapper-aaf a").removeAttr('onclick');
                    $("#wrapper-aaf a").css('cursor', 'pointer');

                }
                else {
                    $("#wrapper-basic .btn-success").attr('disabled', 'disabled');
                    $("#wrapper-aaf a").attr('onclick','return false;');
                    $("#wrapper-aaf a").css('cursor', 'default');
                }
            });

            $('#wrapper-aaf a:not([target="_blank"])').click(function() {
                if ( !($("#legals-checkbox:checkbox").is(":checked")) )
                    alert("Please agree to the terms and conditions to login.");
            });
        });
        // ==============================================================
    }
);
