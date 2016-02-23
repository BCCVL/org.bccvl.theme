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
        // fallback to shift any remaining parsley error messages
        $('[data-parsley-error-message]').each(function(){
            $(this).data('error-message', $(this).data('parsleyErrorMessage'));
        });
        // steal any floating parsley data types to use them as class rules
        $('[data-parsley-type]').each(function(){
            $(this).addClass(''+$(this).data('parsleyDataType')+'');
        });
        // fallback for type to class
        $('[data-type]').each(function(){
            $(this).addClass(''+$(this).data('type')+'');
        });

        $.validator.addMethod('lessThanEqual', function(value, element, param) {
            return this.optional(element) || parseInt(value) <= parseInt($(param).val());
        }, "The value {0} must be less than {1}");

        // add common class rules
        jQuery.validator.addClassRules({
            "number": {
                number: true
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
                    error.insertAfter(element.parents('table'));
                } else if (element.hasClass('require-from-group') && element.parents('div').hasClass('selecteditem')) {
                    element.parents('div.selecteditem').addClass('error');
                    error.insertBefore(element.parents('div.selecteditem'));
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
                $('fieldset.tab:visible').find('.required, .require-from-group').each(function(){
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
