//
// Javascript to perform validation.
//
define(
    ['jquery', 'jquery-validate', 'bootstrap2'],
    function( $) {
        // ==============================================================


        // TODOS
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
        
         // This is dumb AF, but apparently you can't register the same rule with different parameters for the same field.
        // So this is just a duplicate method of the above so that it can be called twice.
        $.validator.addMethod("requireNFromClassThree", function(value, element, options) {
            
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
        
        // add common class rules
        jQuery.validator.addClassRules({
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
                "requireNFromClassThree": [1, ".trait-nom", "species", "Species Name" ],
                "requireAtLeastNOfFromClass": [1, ".trait-nom", ["trait_con", "trait_ord", "trait_nom"], "Trait"],
                "noLongerRequireEnv": [1, ".trait-nom", ["env_var_con", "env_var_cat"]]
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
                } else if (element.parents('#nomination-table').length > 0){
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
                        var element = $(this)[0].element;
                        // find error's tabs, used for rest of function
                        var tabId = $(element).parents('.tab-pane').attr('id');
                        // generate error messages for top panel
                        var errorMessage;
                        if (typeof $(element).data('errorMessage') !== "undefined"){
                            errorMessage = $(element).data('errorMessage');
                        } else if (typeof $(element).data('friendlyName') !== "undefined"){
                            errorMessage = $(element).data('friendlyName');
                        } else if (typeof $(element).attr('placeholder') !== "undefined"){
                            errorMessage = $(element).attr('placeholder');
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
            };
            $.when( tabCheck() ).done(function(){
                if (errorsOnTab == false){
                    $('.bccvl-wizardtabs .nav-tabs li.active a[data-toggle="tab"]').removeClass('error').addClass('completed');
                }
            });

        });

            // ==============================================================
        });

    }
);
