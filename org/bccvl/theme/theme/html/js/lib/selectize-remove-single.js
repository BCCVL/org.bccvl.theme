define(
    ['jquery', 'selectize'],
    function($, Selectize) {

        /**
	 * Escapes a string for use within HTML.
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	var escape_html = function(str) {
	    return (str + '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
	};        

        Selectize.define('remove_single_button', function(options) {

            if (this.settings.mode !== 'single') return;
            
	    options = $.extend({
		label     : '&times;',
		title     : 'Remove',
		className : 'remove-single',
		append    : true
	    }, options);

            var self = this;
	    var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';

	    /**
	     * Appends an element as a child (with raw HTML).
	     *
	     * @param {string} html_container
	     * @param {string} html_element
	     * @return {string}
	     */
	    var append = function(html_container, html_element) {
		var pos = html_container.search(/(<\/[^>]+>\s*)$/);
		return html_container.substring(0, pos) + html_element + html_container.substring(pos);
	    };

            this.setup = (function() {
		var original = self.setup;
		return function() {
                    // override the item rendering method to add the button to each
		    if (options.append) {
			var render_item = self.settings.render.item;
			self.settings.render.item = function(data) {
			    return append(render_item.apply(this, arguments), html);
			};
		    }

                    original.apply(this, arguments);
                    // add event listener
		    this.$control.on('click', '.' + options.className, function(e) {
			e.preventDefault();
			if (self.isLocked) return;
                        self.clear();
		    });
                }
            })();
        });
    }
);
