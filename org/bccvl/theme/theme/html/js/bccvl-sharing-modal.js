define(
    ['jquery', 'bootstrap', 'jquery-tablesorter'],
    function($) {

        return {
            init: function() {

                $(".sharing-btn").click(function(e) {
                    e.preventDefault();

                    var url = $(this).attr('href');
                    
                    if (url.indexOf('#') == 0) {
                        $(url).modal('open');
                    } else {
                        
                        // Show the modal
                        $('.modal').modal({
                            backdrop: 'static'
                        });

                        // Show the ajax spinner (while the form is loading)
                        $('.modal').html(renderSpinner());

                        // AJAX load the form - which takes some time.
                        $.get(url, function(data) {
                            var $modal = $('.modal');
                            $modal.html(data);
                            // make sure there is no redirect when the form is submitted
                            // also hide and empty the modal
                            var $form = $('.modal form');

                            $form.submit(function(event) {
                                event.preventDefault();
                                var btn = $form.find(':submit')[0];
                                var formdata = $form.serializeArray();
                                formdata.push({name: btn.name,
                                               value: btn.value});
                                $.post($form.attr('action'),
                                       formdata,
                                       function(data, status, jqxhr) {
                                           $modal.modal('hide');
                                           $modal.empty();
                                       });
                            });

                            bindUserSearch(url);
                            legalCheckbox();
                        });
                    }
                });

                // when the modal is shown
                $('.modal').on('show', function() {
                    $('.modal-body').scrollTop(0);
                    //$("body").addClass("modal-open");
                });

                // $('.modal').on('hidden', function() {
                //     $("body").removeClass("modal-open");
                // });

            }
        };

        function renderSpinner() {
            var html = '';
            html += '<div style="text-align: center;" id="ajax_loader">';
            html += '<img src="' + portal_url + '/++resource++bccvl/images/ajax-loader.gif"></img>';
            html += '<p>Loading. Please Wait</p>';
            html += '</div>';
            return html;
        }

        // fix the search feature because we're not taking the js from plone
        function bindUserSearch(url) {
            var endPointURL = url.replace('/@@sharing', '//@@updateSharingInfo');
            var $searchField = $('#sharing-user-group-search');
            var $searchButton = $('#sharing-search-button');

            $searchButton.click(function(e) {
                e.preventDefault();

                var query = $searchField.val();
                $.ajax({
                    url: endPointURL,
                    data: {
                        'search_term': query
                    },
                    success: function(data) {
                        $('#user-group-sharing-container').html(data.body);
                        $('#user-group-sharing').addClass('table');
                    }
                });
            });
        }

        function legalCheckbox() {
            $("#legal-checkbox:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("#sharing-save-button").removeAttr("disabled");
                } else {
                    $("#sharing-save-button").attr('disabled', 'disabled');
                }
            });
        }
    }
);
