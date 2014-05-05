//
// Javascript to perform validation.
//
define(
    ['jquery', 'parsley', 'bootstrap'],
    function( $) {
        // ==============================================================

        var customTypeValidator = function(type) {
            var assert;

            switch(type){
                case 'email':
                    assert = new Validator.Assert().Email();
                    break;
                case 'number':
                    assert = new Validator.Assert().Callback(function(value) {
                      var numb = Number(value);
                      return (!Number.isNaN(numb) && Number.isFinite(numb));
                    });
                    // Regexp('^-?(?:\\d+|\\d{1,3}(?:,\\d{3})+)?(?:\\.\\d+)?$');
                    break;
                case 'integer':
                    assert = new Validator.Assert().Callback(function(value) {
                      var numb = Number(value);
                      return Number.isInteger(numb);
                    });
                    //assert = new Validator.Assert().Regexp('^-?\\d+$');
                    break;
                case 'digits':
                    assert = new Validator.Assert().Regexp('^\\d+$');
                    break;
                case 'alphanum':
                    assert = new Validator.Assert().Regexp('^\\w+$', 'i');
                    break;
                case 'url':
                    assert = new Validator.Assert().Regexp('(https?:\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,4}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)', 'i');
                    break;
                default:
                    throw new Error('validator type `' + type + '` is not supported');
            }
            return $.extend(assert, { priority: 256 });
        };

        $(function() {

            // since we're pulling config blocks wholesale from plone, which sucks but is
            // quick to get working, we have to work around a bunch of plone's document
            // strutures and classes.  The easiest way to make validation errors show up
            // is to give plone's ".object-widget-field" things an additional class of
            // ".control-group".
            $('form.bccvl-parsleyvalidate .algo-params .field').addClass('control-group');

            // let's configure parsley globally'
            window.ParsleyConfig = {
                excluded:     'input[type=hidden], :disabled',  // effectively enable validation of input type file (this is disbaled by default)
                //excluded:     ':disabled',  // effectively enable validation of input type file (this is disbaled by default)
                focus:        'none',                           // don't switch focus to errors (we do that manually below)
                successClass: 'success',                        // use these two Bootstrap classes for the error
                errorClass:   'error',                          // and no-error states, and it'll look pretty.
                // this error handling and elements make parsley errors Bootstrap friendly
                trigger: "change keyup",
                classHandler: function(parsleyField) {
                    return parsleyField.$element.closest('.control-group'); },
                errorsContainer: function(parsleyField) {
                    var $controlGroup = parsleyField.$element.closest('.control-group');

                    // if the element is in a table that has a header configured specifically to be used as a control group, use it.
                    var $table = $controlGroup.find('table');
                    var $tableControlGroup = $table.find('th.control-group');
                    if ($tableControlGroup.length > 0)
                        return $tableControlGroup

                    // if the element is in a table, use the table header..
                    var $tableHeader = $controlGroup.find('th');
                    if ($tableHeader.length > 0)
                        return $tableHeader;
                    // otherwise use the controlGroup
                    return $controlGroup;
                },
                errorsWrapper: '<span class=\"help-inline bccvl-formerror\"></span>',
                errorTemplate: '<span></span>'
            };
            // setup custom global validators. This method can be used as soon as parsley.js has been loaded
            window.ParsleyValidator.validators.type = customTypeValidator;
            // right, so now kick off parsley form validation on the forms..
            $('form.bccvl-parsleyvalidate').parsley();

            $.listen('parsley:form:validated', function(parsleyForm) {
                // validate the Projections selected
                var numberOfProjections = parseInt($('.bccvl-available-projections').text());
                if (numberOfProjections == 0) {
                    $('.bccvl-projections-counter').addClass('control-group error');
                    $('.projection-error-message').removeClass('hidden');
                    parsleyForm.validationResult = false;
                }
                else {
                    $('.bccvl-projections-counter').removeClass('control-group error');
                    $('.projection-error-message').addClass('hidden');
                }
                if (! parsleyForm.validationResult) {
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
                                });

                                if (!datasetSelected){
                                    $('.random-absences-settings').parent().addClass('error');
                                    $('.random-absences-settings').parent().removeClass('success');
                                    $('#parsley-formwidgetsspecies_absence_datasetlist').show();
                                }
                            }

                        });

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
                    var $el = $firstError.find('input, select, textarea').first().focus();
                    // scroll outer control group into view
                    var $cg = $el.closest('.control-group');
                    if ($cg.length > 0) {
                        $cg[0].scrollIntoView(false);
                    }
                    return false;
                } else {
                    return true;
                }
            });
        });

        // ==============================================================

    }
);
