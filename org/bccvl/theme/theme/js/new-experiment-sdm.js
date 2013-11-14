
//
// main JS for the new sdm experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation', 'js/bccvl-search', 'parsley', 'bootstrap'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          ,  fadeaway          ,  dimensions                  ,  search          , parsley  ) {
    // ==============================================================
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();         // init the visualiser
            fadeaway.init();    // init the fadeaway instructions
            dimensions.init();  // init the dimension chooser thingy
            wiztabs.init();     // hook up the wizard buttons
            search.init();      // hook up the search fields

            // kick off parsley form validation on all the forms..
            $('form').parsley({
                successClass: 'success',    // use these two Bootstrap classes for the error
                errorClass: 'error',        // and no-error states, and it'll look pretty.
                errors: {
                    // this error handling and elements make parsley errors Bookstrap friendly
                    classHandler:  function(el) { return $(el).closest('.control-group'); },
                    errorsWrapper: '<span class=\"help-inline\"></span>',
                    errorElem:     '<span></span>'
                },
                listeners: {
                    onFormSubmit: function(isFormValid, event, parsleyForm) {
                        console.log('submitting..', isFormValid, event, ParsleyForm);
                        return parsleyForm.parsley('validate');
                    }
                }
            });

        });
    // ==============================================================
    }
);
