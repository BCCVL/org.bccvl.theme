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
            $('form.bccvl-parsleyvalidate .algo-params .field').addClass('control-group');

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
                        // validate the Projections selected
                        var numberOfProjections = parseInt($('.bccvl-available-projections').text());
                        if (numberOfProjections == 0) {
                            $('.bccvl-projections-counter').addClass('control-group error');
                            $('.projection-error-message').removeClass('hidden');
                            isFormValid = false;
                        }
                        else {
                            $('.bccvl-projections-counter').removeClass('control-group error');
                            $('.projection-error-message').addClass('hidden');
                        }
                        if (! isFormValid) {
                            // if the form isn't valid, then there's at least one error
                            // showing somewhere.  But if it's on another tab, parsley
                            // won't be able to focus that field.  So, here we're gonna
                            // find the first error indicator in the document, switch to
                            // its tab, then focus its field.

                            // but before all that, we need to check if the user has selected either to use random points
                            // a dataset for absences for the sdm experiment
                            var $absenceFields = $('.control-group.error').has('.random-absences-settings');

                            if ($absenceFields.length > 0) {
                                if ($('#form-widgets-species_pseudo_absence_points-0').is(':checked')) {
                                    $absenceFields.removeClass('error');
                                }
                                if ($('.control-group.error').length == 0){
                                    return true;
                                }
                            }

                            var $firstError = $('.control-group.error').first();  // first error

                            // show the tab holding the first error
                            var $tabPane = $firstError.closest('.tab-pane');      // tab pane containing first error
                            if ($tabPane.length > 0) {

                                // add listener for the case where the random absense checkbox is selected for SDM
                                $('#form-widgets-species_pseudo_absence_points-0').change(function() {
                                    if ($(this).is(':checked')){
                                        $('.random-absences-settings').parent().addClass('success');
                                        $('.random-absences-settings').parent().removeClass('error');
                                        $('#parsley-formwidgetsspecies_absence_datasetlist').hide();
                                    }
                                    else {
                                        var datasetSelected = false;
                                        var $absencesInput = $('.bccvl-absencestable').find('input');
                                        $absencesInput.each(function(index){
                                            if ($(this).is(':checked')) {
                                                datasetSelected = true;
                                            }
                                        })

                                        if (!datasetSelected){
                                            $('.random-absences-settings').parent().addClass('error');
                                            $('.random-absences-settings').parent().removeClass('success');
                                            $('#parsley-formwidgetsspecies_absence_datasetlist').show();
                                        }
                                    }

                                })

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
