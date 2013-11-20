
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

            // -- hook up algo config -------------------------------
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.

            var $algoCheckboxes = $('input[name="form.widgets.functions:list"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);
                // when the checkbox changes, update the config block's visibility
                $checkbox.change( function(evt) {
                    var $algoCheckbox = $(evt.target);
                    // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.
                    var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
                        } else {
                            $configBlock.hide(250);
                        }
                    } else {
                        console.log("no config block located for algorithm/function '" + $algoCheckbox.attr('value') + "'");
                    }
                });
                // finally, invoke the change handler to get the inital visibility sorted out.
                $checkbox.change();
            });

            // -- form validation -----------------------------------

            // kick off parsley form validation on the forms..
            $('form.bccvl-parsleyvalidate').parsley({
                focus:        'none',       // don't switch focus to errors (we do that manually below)
                successClass: 'success',    // use these two Bootstrap classes for the error
                errorClass:   'error',      // and no-error states, and it'll look pretty.
                errors: {
                    // this error handling and elements make parsley errors Bookstrap friendly
                    classHandler:  function(el) { return $(el).closest('.control-group'); },
                    container:     function(el) {
                        var $controlGroup = $(el).closest('.control-group');
                        var $tableHeader = $controlGroup.find('th');
                        // if the element is in a table, use the table header.
                        if ($tableHeader.length > 0) return $tableHeader;
                        // otherwise just use the surrounding control group.
                        return $controlGroup;
                    },
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
                            console.log('invalid form -- finding bad field.');
                            var $firstError = $('.control-group.error').first();  // first error
                            console.log($firstError);
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
                            $firstError.find('input, select, textarea').first().focus();
                            return false;
                        } else {
                            console.log('form is good -- submitting.')
                            return true;
                        }
                    }
                }
            });
        });
    // ==============================================================
    }
);
