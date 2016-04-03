//
// main JS for the login page.
//
define(
    ['jquery', 'bootstrap2'],
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

            $('#wrapper-aaf a:not([target="_blank"])').click(function() {
                if ( !($("#legals-checkbox:checkbox").is(":checked")) )
                    alert("Please agree to the terms and conditions to login.");
            });
        });
        // ==============================================================
    }
);
