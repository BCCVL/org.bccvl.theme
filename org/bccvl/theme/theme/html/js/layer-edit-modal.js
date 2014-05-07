define(
    ['jquery', 'bootstrap', 'jquery-tablesorter', 'jquery-form', 'parsley'],
    function($) {

        return {
            init: function() {
                // This bit here gets the edit metadata page for environmental layers
                // and makes a modal out of it
                $(".environmentallayers-zip-edit").click(function(e) {

                    // prevents it from going to the href
                    e.preventDefault();

                    var url = $(this).attr('href');

                    // just a little error check if the href isn't blank or a #
                    if (url.indexOf('#') == 0) {
                        $(url).modal('open');
                    } else {

                        // Show the modal
                        $('.modal').modal({
                            backdrop: 'static'
                        });

                        // Show the ajax spinner (while the form is loading)
                        $('.modal').html(renderSpinner());

                        // get the page from url
                        $.get(url, function(data) {
                            // put the page into the modal and show it
                            $('.modal').html(data);
                            $('.modal .listing').addClass('table');
                            $('#crud-edit-form-buttons-edit').addClass('btn btn-primary');
                            var $cancelButton = '<input class="btn btn-danger" type="submit" name="form.button.Cancel" value="Cancel" data-dismiss="modal"></input>';
                            $('.modal form .action').append($cancelButton);

                            // make sure there is no redirect when the form is submitted
                            // also hide and empty the modal

                            $('.select-widget').attr('data-parsley-unique', 'true');

                            // assume parsleyconfig already loaded by bccvl-form-validator.js
                            
                            window.ParsleyValidator
                                .addValidator('unique', function(val, requirement) {
                                    var counter = 0;
                                    $("[data-parsley-unique='true']").each(function() {
                                        if ($(this).val() == val) {
                                            counter++;
                                        }
                                    });

                                    return counter == 1;
                                })
                                .addMessage('en', 'unique', 'Bioclimatic Variable must be unique.')

                            $('form.layers-parsley-validated').parsley();

                            $.listen('parsley:form:validate', function(isFormValid, evt) {

                                var errorList = $(".error[data-parsley-unique='true']");

                                if (errorList.length == 0) {
                                    return true;
                                }
                                else return false;

                            });
             

                            $('.modal form').ajaxForm(function() {
                                $('.modal').modal('hide');
                                $('.modal').empty();
                            });

                            $('.modal').modal();
                        });
                    }
                });


                $('.modal').on('show', function () {
                    $('.modal-body').scrollTop(0);
                    $("body").addClass("modal-open");
                });

                $('.modal').on('hidden', function () {
                    $("body").removeClass("modal-open");
                })

            }

        };

        function renderSpinner() {
            var html = '';
            html += '<div style="text-align: center;" id="ajax_loader">';
            html +=  '<img src="/++resource++bccvl/images/ajax-loader.gif"></img>';
            html +=  '<p>Loading. Please Wait</p>';
            html += '</div>';
            return html;
        }

    }
);
