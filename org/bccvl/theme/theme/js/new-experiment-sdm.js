
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
            $('form.bccvl-parsleyvalidate').parsley({
                focus:        'none',       // don't switch focus to errors (we do that manually below)
                successClass: 'success',    // use these two Bootstrap classes for the error
                errorClass:   'error',      // and no-error states, and it'll look pretty.
                errors: {
                    // this error handling and elements make parsley errors Bookstrap friendly
                    classHandler:  function(el) { return $(el).closest('.control-group'); },
                    errorsWrapper: '<span class=\"help-inline bccvl-formerror\"></span>',
                    errorElem:     '<span></span>'
                },
                listeners: {
                    onFormSubmit: function(isFormValid, evt) {
                        // this listener is named wrong, it's actually run when the form
                        // is validated, which happens before a submit and also whenever
                        // you call form.parsley('validate').
                        if (! isFormValid) {
                            // if the form isn't valid, then there's at least one error
                            // showing somewhere.  But if it's on another tab, parsley
                            // won't be able to focus that field.  So, here we're gonna
                            // find the first error indicator in the document, switch to
                            // its tab, then focus its field.
                            var $firstError = $('.control-group.error').first();  // first error
                            var $tabPane = $firstError.closest('.tab-pane');      // tab pane containing first error
                            if ($tabPane.length > 0) {
                                // tab itself that belongs to the tab pane we're interested in
                                var $tabLink = $('a[data-toggle="tab"][href="#' + $tabPane.attr('id') + '"]');
                                if (! $tabPane.hasClass('active')) {
                                    // if that tab isn't already showing, show it
                                    $tabLink.tab('show');
                                }
                            }
                            // whether we had to flick the tab or not, focus the field
                            $firstError.find('input, select, textarea').focus();
                        }
                    }
                }
            });
        });
    // ==============================================================
    }
);
