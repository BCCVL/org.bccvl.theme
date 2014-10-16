//
// Javascript to perform validation.
//
define(
    ['jquery', 'jquery-validate', 'bootstrap'],
    function( $) {
        // ==============================================================

        // nominate form, init validate
        var form = $('.bccvl-jqueryvalidate');
        // add custom placement/rules
        form.validate({
            // by default hidden fields are ignored, we need to check them.
            ignore: [],
            // custom errors
            errorPlacement: function(error, element){
                // drop error labels for radio fields after the table
                if (element.attr('type') == 'radio') {
                    element.parents('table').addClass('error');
                    error.insertAfter(element.parents('table'));
                } else {
                    error.insertAfter(element);
                }
            },
            // this is default behaviour
            submitHandler: function(form){
                form.submit();
            },
            // this is where we go back to the first invalid field
            invalidHandler: function(event, validator){
                var errors = validator.numberOfInvalids();
                if (errors) {
                    alert('ERRORS!');
                }
            }
        });

        $('[required]').addClass('required');

        $('.bccvl-wizardtabs-next, .bccvl-wizardtabs-prev').click(function(event){
            event.preventDefault();
            // seems to fail if it can't find a required field, iterate without calling the script to prevent this.
            $('fieldset.tab:visible').find('.required').each(function(){
                $(this).valid();
            });
            
        });

        // ==============================================================

    }
);
