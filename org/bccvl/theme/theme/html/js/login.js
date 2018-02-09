//
// main JS for the login page.
//
define(
    ['jquery'],
    function( $) {
        // ==============================================================
        $(function() {
            console.log('login page behaviour loaded.');
            $('.disclaimer.legals.aaf').insertBefore('.aaf-logo-link');
            $('.disclaimer.legals.site').insertBefore('#login_form .formControls');


            $("#wrapper-basic .btn-success, #wrapper-aaf .btn-success").attr('disabled', 'disabled');


            $(".legals input:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $(this).parents('.bccvl-loginfieldset').find('.btn-success').removeAttr("disabled");
                } else {
                    $(this).parents('.bccvl-loginfieldset').find('.btn-success').attr('disabled', 'disabled');

                }
            });

            if ( $("#legals-checkbox-aaf").prop('checked') == true ){
                $('#wrapper-aaf a.aaf-logo-link').attr('disabled', false);
            }

            if ( $("#legals-checkbox-site").prop('checked') == true ){
                $('#login-form input[type="submit"]').attr('disabled', false);
            }

            $('#wrapper-aaf a.aaf-logo-link').click(function() {
                if ( $("#legals-checkbox-aaf").prop('checked') == false ) {
                    alert("Please agree to the terms and conditions to login.");
                    return false;
                };
            });
            $('#login-form input[type="submit"]').click(function(){
                if ( $("#legals-checkbox-site").prop('checked') == false ) {
                    alert("Please agree to the terms and conditions to login.");
                    return false;
                };
            });

        });
        // ==============================================================
    }
);
