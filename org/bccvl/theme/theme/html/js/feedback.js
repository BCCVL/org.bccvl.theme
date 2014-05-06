
//
// main JS for the feedback page.
//
define(     ['jquery', 'js/bccvl-form-validator', 'bootstrap', 'parsley'],
    function( $,        formValidator) {
    // ==============================================================
        $(function() {

            console.log('feedback page behaviour loaded.')

            // if the form has no name, then hide it, since you cannot submit another without first refreshing the page.
            var $form = $('form#feedback');
            if (!$form.attr('name')) {
                $form.hide();
            }

            var $nameField = $('input#sender_fullname');
            var $emailField = $('input#sender_from_address');

            if ($nameField.val()) {
                $nameField.prop('readonly', true);
            }
            if ($emailField.val()) {
                $emailField.prop('readonly', true);
            }



        });
    // ==============================================================
    }
);
