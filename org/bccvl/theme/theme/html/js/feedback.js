
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

        });
    // ==============================================================
    }
);
