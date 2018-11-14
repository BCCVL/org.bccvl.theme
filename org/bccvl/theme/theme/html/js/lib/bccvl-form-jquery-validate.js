//
// Javascript to perform validation.
//
define(
    ['jquery', 'jquery-validation'],
    function( $) {
        // ==============================================================


        // document ready
        $(function() {


        // use required class as well as attr
        $('[required]').addClass('required');

        // fallback for type to class
        $('[data-type]').each(function(){
            $(this).addClass(''+$(this).data('type')+'');
        });

        $.validator.addMethod('lessThanEqual', function(value, element, param) {
            return this.optional(element) || parseInt(value) <= parseInt($(param).val());
        }, "The value {0} must be less than {1}");

        $.validator.addMethod("decimalOrScientific", function(value, element) {
          // allow any non-whitespace characters as the host part
          return this.optional( element ) || /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/.test( value );
        }, 'Please enter a valid number using decimal or scientific notation.');

        $.validator.addMethod("requireNFromClass", function(value, element, options) {

            var numReq =  options[0];
            var selector = options[1];
            var desiredVal = options[2];

            var selection = [];

            $(selector, element.form).filter(function(){
                if ($(this).val()){
                    selection.push($(this).val());
                }
            });

            return $.grep(selection, function(v){
                        return v === desiredVal
                    }).length == numReq;

        }, function(params, element) {
            return "This group requires exactly "+params[0]+" "+params[3]+" fields to be nominated."
        });

        // This is dumb AF, but apparently you can't register the same rule with different parameters for the same field.
        // So this is just a duplicate method of the above so that it can be called twice.
        $.validator.addMethod("requireNFromClassTwo", function(value, element, options) {

            var numReq =  options[0];
            var selector = options[1];
            var desiredVal = options[2];

            var selection = [];

            $(selector, element.form).filter(function(){
                if ($(this).val()){
                    selection.push($(this).val());
                }
            });

            return $.grep(selection, function(v){
                        return v === desiredVal
                    }).length == numReq;

        }, function(params, element) {
            return "This group requires exactly "+params[0]+" "+params[3]+" fields to be nominated."
        });

        $.validator.addMethod("noLongerRequireEnv", function(value, element, options) {

            var numReq =  options[0];
            var selector = options[1];
            var desiredVals = options[2]

            var selection = [];

            //var isValid = false;

            $(selector, element.form).filter(function(){
                if ($(this).val()){
                    selection.push($(this).val());
                }
            });

            $.each(desiredVals, function(i, val){

                var numSel = $.grep(selection, function(v){
                    return v === val
                }).length;

                if (numSel >= numReq){
                    console.log('env var set, no longer require CC nom');
                    $('input[name="form.widgets.environmental_datasets.empty"]').removeClass('required').attr('required', false);
                    $('#tab-enviro fieldset.tab').find('input').valid();
                }
            })

            return true;

        }, function(params, element) {
            return "Validation error, field required on another tab is not operating correctly."
        });

        $.validator.addMethod("requireAtLeastNOfFromClass", function(value, element, options) {

            var numReq =  options[0];
            var selector = options[1];
            var desiredVals = options[2]

            var selection = [];

            var isValid = false;

            $(selector, element.form).filter(function(){
                if ($(this).val()){
                    selection.push($(this).val());
                }
            });

            $.each(desiredVals, function(i, val){

                var numSel = $.grep(selection, function(v){
                    return v === val
                }).length;

                if (numSel >= numReq){
                    isValid = true;
                }
            })

            return isValid;

        }, function(params, element) {
            return "This group requires at least "+params[0]+" "+params[3]+" fields to be nominated."
        });

        $.validator.addMethod("requireFromTab", function(value, element, options) {

            var numReq =  options[0],
                selector = options[1],
                tab = $(element).parents('.tab-pane'),
                numSel = 0;

            tab.find('input'+selector).each(function(i,el){
                if($(this).prop('checked')){ numSel += 1 }
            });

            if (numSel >= numReq) {
                return true;
            } else {
                return false;
            }

        }, function(params, element) {
            return "You must select at least "+params[0]+" "+params[2]+" from this tab."
        });

        $.validator.addMethod("commaAlphaNumeric", function(value, element) {
          // assume true
          var result = true;
          // test for comma seperated range
          var range = value.split(',');
          //console.log(range);
          if ($.type(range) !== "array"){
              result = false;
          }
          $.each(range, function(i,v){
              // test for all integers
              //console.log(parseInt(v));
              if(parseInt(v) === "NaN") {
                  result = false;
              }

              // test for all proper month numbers
              if(v > 12 || v <= 0){
                  result = false;
              }

              // test for duplicate numbers
              var count = range.filter(function(value){
                return v === value;
              }).length;
              if (count > 1){
                  result = false;
              }
          });
          return result;
        }, 'Please enter one or more month numbers, seperated by commas. Months cannot be repeated.');

        /**
         * Checks that the pre-defined region option for constraint area is
         * actually properly filled out.
         * 
         * The "constraint area: pre-defined region" validator should be applied
         * to `<input type="radio" name="constraints_type">` elements.
         * 
         * Note that this validator does assume the DOM structure of the form,
         * and thus will probably need to be modified when the widgets that
         * generate the form change
         * 
         * @param {string | undefined} value
         * @param {Element} element
         */
        function constraintArea_predefinedRegion(value, element) {
            // This validation rule only applies when the type is "pre-defined
            // region" which is defined as "region_no_offset"
            if (value !== "region_no_offset") {
                return true;
            }
            
            // Validation rule doesn't seem to get the actual checked element,
            // so we need to traverse DOM to find this
            var $checkedEl =
                $("input[name='constraints_type']:checked", $(element).closest(".constraint-method").parent());

            // The pre-defined region fields are inside `#select-region` which
            // should be a sibling of the input element
            var $selectRegion = $checkedEl.siblings("#select-region");

            // Check that we actually have the information set in the <input>
            // field that encodes the region (`#form-widgets-modelling_region`)
            var regionVal = $("#form-widgets-modelling_region", $selectRegion).val();

            // If not present, then it fails validation
            if (!regionVal || regionVal.length === 0) {
                return false;
            }

            // If everything passes, then we say that it's okay
            return true;
        }

        $.validator.addMethod(
            "constraintArea_predefinedRegion", 
            constraintArea_predefinedRegion, 
            "Please select a pre-defined region and click 'Add To Map' to confirm."
        );

        // add common class rules
        $.validator.addClassRules({
            "number": {
                number: true
            },
            "decimal-field":{
                "decimalOrScientific": true
            },
            "year": {
                digits: true,
                minlength: 4,
                maxlength: 4
            },
            "month": {
                digits: true,
                minlength: 1,
                maxlength: 2,
                max: 12
            },
            "day": {
                digits: true,
                minlength: 1,
                maxlength: 2,
                max: 31
            },
            "date": {
                date: true
            },
            "algorithm-checkbox": {
                "requireFromTab": [1, ".algorithm-checkbox", "algorithm"]
            },
            "trait-nom": {
                "requireNFromClass": [1, ".trait-nom", "lon", "Longitude"],
                "requireNFromClassTwo": [1, ".trait-nom", "lat", "Latitude" ],
                //"requireNFromClassThree": [1, ".trait-nom", "species", "Species Name" ],
                "requireAtLeastNOfFromClass": [1, ".trait-nom", ["trait_con", "trait_ord", "trait_nom"], "Trait"],
                "noLongerRequireEnv": [1, ".trait-nom", ["env_var_con", "env_var_cat"]]
            },
            "comma-alpha-numeric": {
                "commaAlphaNumeric": true
            }
        });



        console.log('validation behaviour loaded');

        // nominate form, init validate
        var form = $('.bccvl-jqueryvalidate');

        // add custom placement/rules
        form.validate({
            // by default hidden fields are ignored, we need to check them.
            ignore: "",
            // custom errors
            errorPlacement: function(error, element){;
                // drop error labels for radio fields after the table
                if (element.parents('table').length > 0) {
                    element.parents('table').addClass('error');
                    if (element.hasClass('require-from-tab') ) {
                        if (! element.parents('.tab').hasClass('error') ){
                            element.parents('.tab').addClass('error').prepend(error);
                        }
                    } else {
                        error.insertAfter(element.parents('table'));
                    }
                } else if (element.hasClass('require-from-group') && element.parents('div').hasClass('selecteditem')) {
                    element.parents('div.selecteditem').addClass('error');
                    error.insertBefore(element.parents('div.selecteditem'));
                } else if (element.parents('#nomination-table').length > 0){
                    $('#errorMessages').html(error).show();
                    //element.parents('#nomination-table').find('#errorMessages')
                } else if (element.parents(".constraint-method").length > 0) {
                    // For the constraint area check, we place the error above
                    // the constraint area selection group
                    element.parents(".constraint-method").parent().prepend(error);
                } else {
                    error.insertAfter(element);
                }
            },
            success: function(label, element){
                // remove error class from tables once the fields validate.
                if ($(element).parents('table').length > 0) {
                    $(element).parents('table').removeClass('error');
                } else if ($(element).hasClass('require-from-group') && $(element).parents('div').hasClass('selecteditem')) {
                    $(element).parents('div.selecteditem').removeClass('error');
                } else if ( $(element).parents('#nomination-table').length > 0){
                    $('#errorMessages').hide();
                }
            },
            // this is default behaviour
            submitHandler: function(form){

                $(form).find('input[type="submit"], button[type="submit"]').prev('.loader').show();
                $(form).find('input[type="submit"], button[type="submit"]').hide();

                form.submit();
            },
            // this is where we go back to the first invalid field
            invalidHandler: function(event, validator){
                console.log(validator.errorList);
                var errors = validator.numberOfInvalids();
                if (errors) {
                    event.preventDefault();
                    var errorFields = validator.errorList;
                    // add notification panel
                    $('.bccvl-flashmessages').append('<div id="form-errors-panels" class="alert alert-error" style="display:none;"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>Form Errors</h4></div>');

                    // add error or complete classes to headers
                    $.each(errorFields, function(i){
                        // convert array object into jquery object
                        var $element = $(this.element);
                        // find error's tabs, used for rest of function
                        var tabId = $element.parents('.tab-pane').attr('id');
                        // generate error messages for top panel
                        var errorMessage;
                        if (typeof $element.data('errorMessage') !== "undefined"){
                            errorMessage = $element.data('errorMessage');
                        } else if (typeof $element.data('friendlyName') !== "undefined"){
                            errorMessage = $element.data('friendlyName');
                        } else if (typeof $element.attr('placeholder') !== "undefined"){
                            errorMessage = $element.attr('placeholder');
                        } else if ($element.closest(".constraint-method").length > 0) {
                            // Special case for constraint area pre-defined region
                            errorMessage = this.message;
                        } else {
                            errorMessage = "Problem with field.";
                        }
                        // add error messages
                        $('#form-errors-panels').append('<p><strong>'+errorMessage+'</strong> ('+$('body a[href="#'+tabId+'"]').text()+' tab)');

                        // tab switching
                        if (i == 0){
                            // this is the first error field and we'll switch to its tab
                            $('body a[href="#'+tabId+'"]').trigger('click');
                        }

                        // tab classes
                        // add completed class by default, as we only have access to errors here
                        $('.bccvl-wizardtabs .nav-tabs a[data-toggle="tab"]').addClass('completed');
                        // remove completed class and add errors to tab headers
                        $('body a[href="#'+tabId+'"]').removeClass('completed').addClass('error');
                    });

                    // Throw an event for google analytics
                    $('.bccvl-flashmessages').trigger('validationError');

                    // need to add a panel at the top that says number of errors (and tab names maybe?)
                    $('#form-errors-panels').slideDown(500, function(){
                        setTimeout(function(){
                            $('#form-errors-panels').slideUp(500, function(){
                                $('#form-errors-panels').html('<button type="button" class="close" data-dismiss="alert">&times;</button><h4>Form Errors</h4>');
                            });
                        },5000);
                    });
                    //alert('There are errors or incomplete fields in the form that need to be addressed before the experiment can begin.');
                }
            },
            rules: {
                "constraints_type": "constraintArea_predefinedRegion"
            }
        });

        form.on('widgetChanged', function(){
            form.find('.require-from-group').each(function(){
                $(this).rules('add', {
                    required: true,
                    minlength: 1,
                    messages: {
                        required: 'You must select at least one.'
                    }
                });
            });
        });



        // use error messages from element attributes (if they exist).
        form.find('.required[data-error-message]').each(function(){
            $(this).rules('add', {
                messages: {
                    required: $(this).data('errorMessage')
                }
            });
        });


        $('.bccvl-wizardtabs-next, .bccvl-wizardtabs-prev, .bccvl-wizardtabs .nav-tabs a[data-toggle="tab"]').click(function(event, form){
            event.preventDefault();
            // seems to fail if it can't find a required field, iterate without calling the script to prevent this.
            var errorsOnTab = false;
            var tabCheck = function(){
                $('fieldset.tab:visible').find('.required, .require-from-group, .require-from-tab').each(function(){
                    if ( $(this).valid() != true ){
                        errorsOnTab = true;
                        $('body a[href="#'+$(this).parents('.tab-pane').attr('id')+'"]').removeClass('completed').addClass('error');
                    }
                });

                // If the constraints type input fields are present, we also
                // run validation
                var $constraintsType = $("input[name='constraints_type']", $('fieldset.tab:visible'));

                if ($constraintsType.length > 0) {
                    // Run the validation function on the element
                    var constraintAreaValid = $constraintsType.valid();

                    if (!constraintAreaValid) {
                        errorsOnTab = true;
                    }
                }
            };
            $.when( tabCheck() ).done(function(){
                var $tab = $('.bccvl-wizardtabs .nav-tabs li.active a[data-toggle="tab"]');

                if (errorsOnTab){
                    // Highlight error
                    $tab.removeClass('completed').addClass('error');
                } else {
                    // Remove error and highlight as done
                    $tab.removeClass('error').addClass('completed');
                }
            });

        });

        // Re-run validation when map selection made for constraint areas
        //
        // The click event handler here has been namespaced under
        // `.bccvl-form-jquery-validate` so that it can be manipulated without
        // conflicting with other handlers
        $(".btn.draw-geojson").on("click.bccvl-form-jquery-validate", function(e) {
            // Look for constraint method input fields
            var $constraintMethod = $(this).closest(".constraint-method");

            if ($constraintMethod.length === 0) {
                // No constraint method input fields found, bailing out
                return;
            }

            var $constraintsType = $("input[name='constraints_type']", $constraintMethod);

            // Run validation which should automatically handle the
            // success/error condition rendering
            //
            // Note that we run this in the next event loop cycle because the
            // region information would not have been inserted into the hidden
            // <input> field at this very moment in time
            setTimeout(function() {
                $constraintsType.valid();
            }, 0);
        });

        // document ready
        });

    }
);
