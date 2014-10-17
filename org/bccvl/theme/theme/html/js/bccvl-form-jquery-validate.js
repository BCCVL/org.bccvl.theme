//
// Javascript to perform validation.
//
define(
    ['jquery', 'jquery-validate', 'bootstrap'],
    function( $) {
        // ==============================================================


        // TODOS
        // *DONE* - Add error/complete class to tab header
        // *DONE* - Add validation triggers to tab header clicks
        // *DONE* - Add return to first invalid field on submit
        // *DONE* - Add error/complete class to tab headers on submit
        // *DONE* - Add notification of how many errors to panel above form
        // Mirror parsley rules with validate rules
        // Start removing parsley from
        // Clean up code, add notes


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
        // add common class rules
        jQuery.validator.addClassRules(
            'number', {
                number: true
        });

        // nominate form, init validate
        var form = $('.bccvl-jqueryvalidate');
        // add custom placement/rules
        form.validate({
            // by default hidden fields are ignored, we need to check them.
            // unless they're alogrithm config fields
            ignore: "#algoConfig :hidden",
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
                    event.preventDefault();
                    var errorFields = validator.currentElements;
                    // add notification panel
                    $('.bccvl-flashmessages').append('<div id="form-errors-panels" class="alert alert-error" style="display:none;"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>Form Errors</h4></div>');

                    // add error or complete classes to headers
                    $.each(errorFields, function(i){
                        // find error's tabs, used for rest of function
                        var tabId = $(this).parents('.tab-pane').attr('id');

                        // generate error messages for top panel
                        var errorMessage;
                        if (typeof $(this).data('errorMessage') !== "undefined"){
                            errorMessage = $(this).data('errorMessage');
                        } else if (typeof $(this).data('friendlyName') !== "undefined"){
                            errorMessage = $(this).data('friendlyName');
                        } else if (typeof $(this).attr('placeholder') !== "undefined"){
                            errorMessage = $(this).attr('placeholder');
                        } else {
                            errorMessage = "Problem with field."
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

        $('.bccvl-wizardtabs-next, .bccvl-wizardtabs-prev, .bccvl-wizardtabs .nav-tabs a[data-toggle="tab"]').click(function(event){
            event.preventDefault();
            // seems to fail if it can't find a required field, iterate without calling the script to prevent this.
            var errorsOnTab = false;
            var tabCheck = function(){
                $('fieldset.tab:visible').find('.required').each(function(){
                    if ( $(this).valid() != true ){
                        errorsOnTab = true;
                        $('body a[href="#'+$(this).parents('.tab-pane').attr('id')+'"]').removeClass('completed').addClass('error');
                    }
                });
            }
            $.when( tabCheck() ).done(function(){
                if (errorsOnTab == false){
                    $('.bccvl-wizardtabs .nav-tabs li.active a[data-toggle="tab"]').removeClass('error').addClass('completed');
                }
            });

        });

        // ==============================================================

    }
);
