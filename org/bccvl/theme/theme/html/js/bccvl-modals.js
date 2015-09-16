//
// little helpers to manage all sorts of display modal
//

define(
    ['jquery', 'bootstrap'],
    function($, bootstrap) {

        // create "class" InfoModal
        function InfoModal(modal_id) {
            this.modal_id = modal_id || 'info-modal';
        };

        InfoModal.prototype.render_modal_load = function() {
            var html = '<div id="' + this.modal_id + '" role="dialog" class="modal hide fade">' +
                    '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' +
                    '<div class="modal-body">' +                    
                    '<span class="loading-gif"></span>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '</div>' +
                    '</div>';
            return html;
        };

        InfoModal.prototype.init = function(el, selector) {
            var self = this;
            $(el).on('click', selector, function(event) {
                // we are resetting this to the object instance here
                self.click_handler(event);
            });
        };

        InfoModal.prototype.replace_content = function(content) {
            var $modal = $('#' + this.modal_id);
            $modal.children().fadeOut(300, function() {
                $modal.html(content).children().hide();
                $modal.children().fadeIn(300);
            });
        };

        InfoModal.prototype.click_handler = function(event) {
            event.preventDefault();

            var $el = $(event.currentTarget);
            var html = this.render_modal_load();
            // remove modal_id from dom
            $('#' + this.modal_id).remove();
            // add new modal:
            $('body').append(html);
            var $modal = $('#' + this.modal_id);
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
            //$('#' + modal_id).modal('show');
        };

        return {
            'InfoModal': InfoModal
        };
        
    }
);
