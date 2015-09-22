//
// little helpers to manage all sorts of display modal
//

define(
    ['jquery', 'bootstrap'],
    function($, bootstrap) {

        // Modal object
        // properties:
        //     id ... the element id to use
        function Modal(id) {
            // Modal object constructor
            this.id = id || 'bccvl-modal';
        }

        // Modal.render_modal_load
        // the initial html to render before content is loaded via ajax
        Modal.prototype.render_modal_load = function() {
            var html = '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                    '<div class="modal-body">' +                    
                    '<span class="loading-gif"></span>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '</div>';
            return html;
        };

        // Modal.render_modal
        //   generate modal + given content
        Modal.prototype.render_modal = function(content) {
            return '<div id="' + this.id + '" role="dialog" class="modal hide fade">' +
                content + '</div>';
        }

        // Modal.bind
        // bind Modal.click_handler event handler on el and selector
        // subclasses need to define click_handler
        Modal.prototype.bind = function(el, selector) {
            var self = this;
            $(el).on('click', selector, function(event) {
                // we are resetting this to the object instance here
                self.click_handler(event);
            });
        };

        // Modal.replace_content
        // replace entire modal with content using a fade in/out effect
        Modal.prototype.replace_content = function(content) {
            var $modal = $('#' + this.id);
            $modal.children().fadeOut(300, function() {
                $modal.html(content).children().hide();
                $modal.children().fadeIn(300);
            });
        };
        

        // InfoModal
        //   used to render various info modal dialogs
        // create "class" InfoModal
        function InfoModal(id) {
            this.id = id || 'info-modal';
        };
        // InfoModal inherits from Modal
        InfoModal.prototype = new Modal(); // inherit prototype
        InfoModal.prototype.constructor = InfoModal; // use new constructor

        // TODO: click_handler is very generic for all ajax modals
        //       make this part of base class .... 
        // click_handler for InfoModal 
        InfoModal.prototype.click_handler = function(event) {
            event.preventDefault();

            var $el = $(event.currentTarget);
            var html = this.render_modal(this.render_modal_load());
            // remove id from dom
            $('#' + this.id).remove();
            // add new modal:
            $('body').append(html);
            var $modal = $('#' + this.id);
            $modal.modal({
                backdrop: true,
                keyboard: true,
                show: true
            });
            $modal.on('hidden', function(evt) {
                $modal.remove();
            });
            // load modal content
            $.ajax($el.attr('href'), {
                accept: 'text/html',
                //complete: function(jqXHR, textStatus) {},
                dataType: 'html',
                context: this,
                data: {ajax_load: 1},
                error: function(jqXHR, textStatus, errorThrown) {
                    this.replace_content(
                        '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                            '<div class="modal-body">' +                    
                            '<div class="alert alert-error">Fetching remote content failed</div>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                            '</div>'
                    );
                },
                success: function(data, textStatus, jqXHR) {
                    this.replace_content(data);
                }
            });
            //$('#' + id).modal('show');
        };


        // RemoveModal
        //   used to render various remove modal dialogs
        // create "class" RemoveModal
        function RemoveModal(id) {
            this.id = id || 'remove-modal';
        };
        // InfoModal inherits from Modal
        RemoveModal.prototype = new Modal(); // inherit prototype
        RemoveModal.prototype.constructor = RemoveModal; // use new constructor

        // click_handler for RemoveModal 
        RemoveModal.prototype.click_handler = function(event) {
            event.preventDefault();

            var $el = $(event.currentTarget);
            var html = this.render_modal(this.render_modal_load());
            // remove id from dom
            $('#' + this.id).remove();
            // add new modal:
            $('body').append(html);
            var $modal = $('#' + this.id);
            $modal.modal({
                backdrop: true,
                keyboard: true,
                show: true
            });
            $modal.on('hidden', function(evt) {
                $modal.remove();
            });
            // load modal content
            $.ajax($el.attr('href'), {
                accept: 'text/html',
                //complete: function(jqXHR, textStatus) {},
                dataType: 'html',
                context: this,
                data: {ajax_load: 1},
                error: function(jqXHR, textStatus, errorThrown) {
                    this.replace_content(
                        '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                            '<div class="modal-body">' +                    
                            '<div class="alert alert-error">Fetching remote content failed</div>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                            '</div>'
                    );
                },
                success: function(data, textStatus, jqXHR) {
                    var self = this;
                    this.replace_content(data);
                    // our new modal contains a form ,... let's bind events and for cancel and submit?
                    var $modal = $('#' + this.id);
                    $modal.on('click', 'button[type="submit"]', function(event) {
                        self.submit_handler(event);
                    });
                    $modal.on('click', 'a.btn', function(event) {
                        event.preventDefault();
                        $modal.modal('hide');
                    });
                }
            });
            //$('#' + id).modal('show');
        };

        // handle form event inside modal
        RemoveModal.prototype.submit_handler = function(event) {
            // submit runs inside modal .... check return value and redirect to wherever response says
            // this ... this object
            event.preventDefault();
            var $modal = $('#' + this.id);  // our modal
            var $el = $(event.currentTarget);  // the button clicked
            var $form = $el.closest('form')
            var formdata = $form.serializeArray()
            // add button pressed
            formdata.push({ name: $el.attr('name'), value: $el.val() });
            // add ajax_load
            formdata.push({name: 'ajax_load', value: 1});
            $.ajax({
                type: $form.attr('method'),
                url: $form.attr('action'),
                data: formdata,
                context: this,
                error: function(jqXHR, textStatus, errorThrown) {
                    this.replace_content(
                        '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                            '<div class="modal-body">' +                    
                            '<div class="alert alert-error">Fetching remote content failed</div>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                            '</div>'
                    );
                },
                success: function(data, textStatus, jqXHR) {
                    // can't check for redirect here... so if success assume it's all good
                    // and reload the page
                    location.reload();
                }
            });

            // close modal on success
            this.replace_content(this.render_modal_load());
        };


        // SharingModal
        //   used to render various remove modal dialogs
        // create "class" SharingModal
        function SharingModal(id) {
            this.id = id || 'sharing-modal';
        };
        // InfoModal inherits from Modal
        SharingModal.prototype = new Modal(); // inherit prototype
        SharingModal.prototype.constructor = SharingModal; // use new constructor

        // click_handler for RemoveModal 
        SharingModal.prototype.click_handler = function(event) {
            event.preventDefault();

            var $el = $(event.currentTarget);
            var html = this.render_modal(this.render_modal_load());
            // remove id from dom
            $('#' + this.id).remove();
            // add new modal:
            $('body').append(html);
            var $modal = $('#' + this.id);
            $modal.modal({
                backdrop: true,
                keyboard: true,
                show: true
            });
            $modal.on('hidden', function(evt) {
                $modal.remove();
            });
            // load modal content
            $.ajax($el.attr('href'), {
                accept: 'text/html',
                //complete: function(jqXHR, textStatus) {},
                dataType: 'html',
                context: this,
                data: {ajax_load: 1},
                error: function(jqXHR, textStatus, errorThrown) {
                    this.replace_content(
                        '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                            '<div class="modal-body">' +                    
                            '<div class="alert alert-error">Fetching remote content failed</div>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                            '</div>'
                    );
                },
                success: function(data, textStatus, jqXHR) {
                    var self = this;
                    this.replace_content(data);
                    // our new modal contains a form ,... let's bind events and for cancel and submit?
                    var $modal = $('#' + this.id);
                    $modal.on('click', 'button[type="submit"]', function(event) {
                        self.submit_handler(event);
                    });
                    $modal.on('click', 'a.btn', function(event) {
                        event.preventDefault();
                        $modal.modal('hide');
                    });
                    // and some special hook ups for the sharing form
                    $modal.on('click', '#sharing-search-button', function(event) {
                        event.preventDefault();
                        var url = $(this).closest('form').attr('action');
                        var endPointURL = url.replace('/@@sharing', '//@@updateSharingInfo');
                        var query = $('#sharing-user-group-search').val();
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
                    $modal.on('change', "#legal-checkbox", function(event) {
                        if ($(this).is(":checked")) {
                            $("#sharing-save-button").removeAttr("disabled");
                        } else {
                            $("#sharing-save-button").attr('disabled', 'disabled');
                        }
                    });
                }
            });
            //$('#' + id).modal('show');
        };

        // handle form event inside modal
        SharingModal.prototype.submit_handler = function(event) {
            // submit runs inside modal .... check return value and redirect to wherever response says
            // this ... this object
            event.preventDefault();
            var $modal = $('#' + this.id);  // our modal
            var $el = $(event.currentTarget);  // the button clicked
            var $form = $el.closest('form')
            var formdata = $form.serializeArray()
            // add button pressed
            formdata.push({ name: $el.attr('name'), value: $el.val() });
            // add ajax_load
            formdata.push({name: 'ajax_load', value: 1});
            $.ajax({
                type: $form.attr('method'),
                url: $form.attr('action'),
                data: formdata,
                context: this,
                error: function(jqXHR, textStatus, errorThrown) {
                    this.replace_content(
                        '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                            '<div class="modal-body">' +                    
                            '<div class="alert alert-error">Fetching remote content failed</div>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                            '</div>'
                    );
                },
                success: function(data, textStatus, jqXHR) {
                    // can't check for redirect here... so if success assume it's all good
                    // for sharing we don't need to reload the page; just close the modal
                    $modal.modal('hide');
                }
            });

            // close modal on success
            this.replace_content(this.render_modal_load());
        };
        

        return {
            'InfoModal': InfoModal,
            'RemoveModal': RemoveModal,
            'SharingModal': SharingModal
        };
        
    }
);
