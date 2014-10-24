define(
    ['jquery', 'jquery-ui'],
    function($) {

    function single_selectable($elements) {
        $elements.selectable({
            selected: function(event, ui) {
                $(ui.selected).addClass("ui-selected")
                    .siblings()
                    .removeClass("ui-selected");
            }
        });
    }


    var select_dataset = function($element, options) {

        // required options: field, genre

        var settings = $.extend({
            // These are the defaults.
            target: '#' + options.field + '-modal',
            remote: 'datasets_listing_popup',
            widgetname: 'form.widgets.' + options.field,
            widgetid: 'form-widgets-' + options.field,
            widgeturl: location.origin + location.pathname + '/++widget++' + options.field,
            widgetelement: 'div.selecteditem',
            result_selector: '#datasets-popup-result',
            result_child_selector: '#datasets-popup-result-list'
        }, options );

        // variable names that make more sense
        var $modal = $(settings.target);

        // hookup popup button/link to show modal
        $element.click(function(event) {
            event.preventDefault();
            // show modal
            var paramlist = [];
            $.each(settings.genre, function(index, value) {
                paramlist.push({name: 'datasets.filter.genre:list',
                                value: value});
            });
            // bootstrap 2 modal does'n have loaded event so we have to do it ourselves
            $modal.modal('show')
                .find('.modal-body')
                .load(settings.remote + '?' + $.param(paramlist), function() {
                   bind_events_on_modal_content();
                });
        });

        // initialise modal when finished loading
        function bind_events_on_modal_content() {
            // hookup events within modal
            $modal.find('form').submit(function(event) {
                event.preventDefault();
                $modal.find(settings.result_selector).load(
                    $(this).attr('action') + ' ' + settings.result_child_selector,
                    $(this).serialize(),
                    // reapply single select events
                    function() {
                        single_selectable($modal.find(settings.result_child_selector));
                    }
                );
            });
            // single select on first load
            single_selectable($modal.find(settings.result_child_selector));
        };

        // clear modal on close
        $modal.on('hidden', function() {
            $(this).removeData('modal');
            $(this).find('.modal-body').empty();
        });

        // when user preses 'save' button in modal
        $modal.find('button.btn-primary').click(function() {
            // get selected element
            var $selected = $modal.find('.ui-selected');
            var uuid = $selected.map(function() { return $(this).attr('data-uuid'); }).get();
            // we have all the data we need so get rid of the modal
            $modal.modal('hide');
            if ($selected.length) {
                // fetch html for widget
                var params = [{name: 'ajax_load', value: 1}];
                $.each(uuid, function(index, value){
                    params.push({name: settings.widgetname, value: value});
                });
                $('#' + settings.widgetid + '-selected').load(
                    settings.widgeturl + ' ' + settings.widgetelement,
                    params
                );
            }
        });

        // allow user to remove selected elements
        $('div[data-fieldname="' + settings.widgetname + '"]').on('click', 'div.selecteditem i.icon-remove', function(event){
            event.preventDefault();
            $(this).parents('div.selecteditem').remove();
        });

    };

    var select_dataset_layers = function($element, options) {

        // required options: field, genre

        var settings = $.extend({
            // These are the defaults.
            target: '#' + options.field + '-modal',
            remote: 'datasets_listing_popup',
            widgetname: 'form.widgets.' + options.field,
            widgetid: 'form-widgets-' + options.field,
            widgeturl: location.origin + location.pathname + '/++widget++' + options.field,
            widgetelement: 'div.selecteditem',
            result_selector: '#datasets-popup-result',
            result_child_selector: '#datasets-popup-result-list'
        }, options );

        // variable names that make more sense
        var $modal = $(settings.target);

        // hookup popup button/link to show modal
        $element.click(function(event) {
            event.preventDefault();
            // show modal
            var paramlist = [{name: 'datasets.filter.enable_layers',
                              value: 1}];
            $.each(settings.genre, function(index, value) {
                paramlist.push({name: 'datasets.filter.genre:list',
                                value: value});
            });
            // bootstrap 2 modal does'n have loaded event so we have to do it ourselves
            $modal.modal('show')
                .find('.modal-body')
                .load(settings.remote + '?' + $.param(paramlist), function() {
                   bind_events_on_modal_content();
                });
        });

        // initialise modal when finished loading
        function bind_events_on_modal_content() {
            // hookup events within modal
            $modal.find('form').submit(function(event) {
                event.preventDefault();
                $modal.find(settings.result_selector).load(
                    $(this).attr('action') + ' ' + settings.result_child_selector,
                    $(this).serialize(),
                    // reenable selectable
                    function() {
                        $modal.find(settings.result_child_selector).selectable();
                    }
                );
            });
            // enable selectable
            $modal.find(settings.result_child_selector).selectable();
        };

        // clear modal on close
        $modal.on('hidden', function() {
            $(this).removeData('modal');
            $(this).find('.modal-body').empty();
        });

        // when user preses 'save' button in modal
        $modal.find('button.btn-primary').click(function() {
            // get selected element
            var $selected = $modal.find('.ui-selected');
            var uuid = $selected.map(function() {
                return {uuid: $(this).attr('data-uuid'),
                        layer: $(this).attr('data-layer')};
                }).get();
            // we have all the data we need so get rid of the modal
            $modal.modal('hide');
            if ($selected.length) {
                // we only change things if there was a selection
                var params = [{name: 'ajax_load', value: 1}];
                // collect all existing datasets and layers
                var $cursel = $('input[name^="' + settings.widgetname + '.dataset"]');
                var count = 0;
                $.each($cursel, function(index, dsinput) {
                    var $layer = $('input[name="' + $(dsinput).attr('name').replace(/\.dataset\./, '.layer.') + '"]');
                    params.push({name: settings.widgetname + '.dataset.' + count,
                                 value: $(dsinput).val()});
                    params.push({name: settings.widgetname + '.layer.' + count,
                                 value: $layer.val()});
                    count += 1;
                });
                // collect newly selected layers
                $.each(uuid, function(index, value){
                    params.push({name: settings.widgetname + '.dataset.' + count,
                                 value: value.uuid});
                    params.push({name: settings.widgetname + '.layer.' + count,
                                 value: value.layer});
                    count += 1;
                });
                // add count parameter
                params.push({name: settings.widgetname + '.count', value: count});
                // fetch html for widget
                $('#' + settings.widgetid + '-selected').load(
                    settings.widgeturl + ' ' + settings.widgetelement,
                    params
                );
            }
        });

        // allow user to remove selected elements
        $('div[data-fieldname="' + settings.widgetname + '"]').on('click', 'div.selecteditem i.icon-remove', function(event){
            event.preventDefault();
            $(this).parents('div.selecteditem').remove();
        });

    };

        return ({
            select_dataset: select_dataset,
            select_dataset_layers: select_dataset_layers
        });

});