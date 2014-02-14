//
// Javascript to perform validation.
//
define(     ['jquery', 'parsley', 'bootstrap'],
    function( $) {
    // ==============================================================

        $(function() {

        	// since we're pulling config blocks wholesale from plone, which sucks but is
            // quick to get working, we have to work around a bunch of plone's document
            // strutures and classes.  The easiest way to make validation errors show up
            // is to give plone's ".object-widget-field" things an additional class of
            // ".control-group".
            $('form.bccvl-parsleyvalidate .object-widget-field').addClass('control-group');

            // right, so now kick off parsley form validation on the forms..
            $('form.bccvl-parsleyvalidate').parsley({
                excluded:     'input[type=hidden], :disabled',  // effectively enable validation of input type file (this is disbaled by default)
                focus:        'none',                           // don't switch focus to errors (we do that manually below)
                successClass: 'success',                        // use these two Bootstrap classes for the error
                errorClass:   'error',                          // and no-error states, and it'll look pretty.
                errors: {
                    // this error handling and elements make parsley errors Bookstrap friendly
                    classHandler: function(el) { return $(el).closest('.control-group'); },
                    container: function(el) {
                        var $controlGroup = $(el).closest('.control-group');
                        var $tableHeader = $controlGroup.find('th');
                        // if the element is in a table, use the table header..
                        if ($tableHeader.length > 0) return $tableHeader;
                        // otherwise use the controlGroup
                        return $controlGroup;
                    },
                    errorsWrapper: '<span class=\"help-inline bccvl-formerror\"></span>',
                    errorElem:     '<span></span>'
                },
                listeners: {
                    onFormValidate: function(isFormValid, evt) {
                        if (! isFormValid) {
                            // if the form isn't valid, then there's at least one error
                            // showing somewhere.  But if it's on another tab, parsley
                            // won't be able to focus that field.  So, here we're gonna
                            // find the first error indicator in the document, switch to
                            // its tab, then focus its field.
                            var $firstError = $('.control-group.error').first();  // first error

                            // show the tab holding the first error
                            var $tabPane = $firstError.closest('.tab-pane');      // tab pane containing first error
                            if ($tabPane.length > 0) {
                                // tab itself that belongs to the tab pane we're interested in
                                var $tabLink = $('a[data-toggle="tab"][href="#' + $tabPane.attr('id') + '"]');
                                if (! $tabPane.hasClass('active')) {
                                    // if that tab isn't already showing, show it
                                    $tabLink.tab('show');
                                }
                            }

                            // open the config accordion holding the first error
                            var $accordionPane = $firstError.closest('.accordion-group').find('.accordion-body');

                            if ($accordionPane.length > 0) {
                                // if that pane isn't already showing, show it
                                $accordionPane.collapse('show');
                            }

                            // whether we had to flick the tab or not, focus the field
                            $firstError.find('input, select, textarea').first().focus();
                            return false;
                        } else {
                            return true;
                        }
                    }
                }
            });

        });

    // ==============================================================
    
    }
);