define(
    ['jquery', 'jquery-ui'],
    function($) {

        // helper to enforce single selection for jquery-ui selectable
        function single_selectable($elements) {
            $elements.selectable({
                selected: function(event, ui) {
                    $(ui.selected).addClass("ui-selected")
                        .siblings()
                        .removeClass("ui-selected");
                }
            });
        }


        // single select widget
        var select_dataset = function($element, options) {

            // TODO: document settings
            var settings = $.extend({
                // These are the defaults.
                target: '#' + options.field + '-modal',
                remote: 'datasets_listing_popup',
                widgetname: 'form.widgets.' + options.field,
                widgetid: 'form-widgets-' + options.field,
                widgeturl: location.origin + location.pathname + '/++widget++' + options.field,
                widgetelement: '#form-widgets-' + options.field + '-selected >',
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

            function load_search_results(url, params) {
                $modal.find(settings.result_selector).load(
                    url + ' ' + settings.result_child_selector, params,
                    // reapply single select events
                    function() {
                        single_selectable($modal.find(settings.result_child_selector));
                        // intercept pagination links
                        $modal.find('div.pagination a').click( function(event) {
                            event.preventDefault();
                            load_search_results($(this).attr('href'));
                        });
                    }
                );
            };

            // initialise modal when finished loading
            function bind_events_on_modal_content() {
                // hookup events within modal
                $modal.find('form').submit(function(event) {
                    event.preventDefault();
                    load_search_results($(this).attr('action'), $(this).serialize());
                });
                // single select on first load
                single_selectable($modal.find(settings.result_child_selector));
                // intercept pagination links
                $modal.find('div.pagination a').click( function(event) {
                    event.preventDefault();
                    load_search_results($(this).attr('href'));
                });
            };

            // reload widget via ajax
            function reload_widget(params) {
                $('#'+settings.widgetid+'-selected').parent().find('span.loader-container img.loader').show(0);
                // add ajax_load parameter
                params.push({name: 'ajax_load', value: 1});
                $('#' + settings.widgetid + '-selected').load(
                    settings.widgeturl + ' ' + settings.widgetelement,
                    params
                    , function(){
                        $('#'+settings.widgetid+'-selected').parent().find('span.loader-container img.loader').hide();
                    }
                );
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
                    var params = [];
                    $.each(uuid, function(index, value){
                        params.push({name: settings.widgetname, value: value});
                    });
                    reload_widget(params);
                }
            });

            // allow user to remove selected elements
            $('div[data-fieldname="' + settings.widgetname + '"]').on('click', 'div.selecteditem i.icon-remove', function(event){
                event.preventDefault();
                reload_widget([]);
            });

        };

        // multi layer select widget
        var select_dataset_layers = function($element, options) {

            // required options: field, genre

            var settings = $.extend({
                // These are the defaults.
                target: '#' + options.field + '-modal',
                remote: 'datasets_listing_popup',
                widgetname: 'form.widgets.' + options.field,
                widgetid: 'form-widgets-' + options.field,
                widgeturl: location.origin + location.pathname + '/++widget++' + options.field,
                widgetelement: '#form-widgets-' + options.field + '-selected >',
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

            function load_search_results(url, params) {
                $modal.find(settings.result_selector).load(
                    url + ' ' + settings.result_child_selector, params,
                    // reapply single select events
                    function() {
                        // enable selectable
                        $modal.find(settings.result_child_selector).selectable();
                        // intercept pagination links
                        $modal.find('div.pagination a').click( function(event) {
                            event.preventDefault();
                            load_search_results($(this).attr('href'));
                        });
                    }
                );
            };

            // initialise modal when finished loading
            function bind_events_on_modal_content() {
                // hookup events within modal
                $modal.find('form').submit(function(event) {
                    event.preventDefault();
                    load_search_results($(this).attr('action'), $(this).serialize());
                });
                // enable selectable
                $modal.find(settings.result_child_selector).selectable();
                // intercept pagination links
                $modal.find('div.pagination a').click( function(event) {
                    event.preventDefault();
                    load_search_results($(this).attr('href'));
                });
            };

            // reload widget via ajax
            function reload_widget(params) {
                $('#'+settings.widgetid+'-selected').parent().find('span.loader-container img.loader').show(0);
                // add ajax_load parameter
                params.push({name: 'ajax_load', value: 1});
                $('#' + settings.widgetid + '-selected').load(
                    settings.widgeturl + ' ' + settings.widgetelement,
                    params
                    , function(){
                        $('#'+settings.widgetid+'-selected').parent().find('span.loader-container img.loader').hide();
                    });
            };

            // return currently selected datasets and layers
            // as structure suitable to pass on to reload_widget
            function get_current_selection() {
                var params = [];
                var count = 0;
                // collect all existing datasets and layers
                var $cursel = $('input[name^="' + settings.widgetname + '.dataset"]');
                $.each($cursel, function(index, dsinput) {
                    var $layer = $('input[name="' + $(dsinput).attr('name').replace(/\.dataset\./, '.layer.') + '"]');
                    params.push({name: settings.widgetname + '.dataset.' + count,
                                 value: $(dsinput).val()});
                    params.push({name: settings.widgetname + '.layer.' + count,
                                 value: $layer.val()});
                    count += 1;
                });
                return params;
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
                    var params = get_current_selection();
                    // collect all existing datasets and layers
                    var count = params.length;
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
                    reload_widget(params);
                }
            });

            // allow user to remove selected elements
            $('div[data-fieldname="' + settings.widgetname + '"]').on('click', 'div.selecteditem i.icon-remove', function(event) {
                event.preventDefault();
                $(this).parents('div.selecteditem').remove();
                var params = get_current_selection();
                // add count parameter
                params.push({name: settings.widgetname + '.count', value: params.length});
                // fetch html for widget
                reload_widget(params);
            });

        };

        // turn select box into potentially nice multiselect
        var select_multi = function(select, options) {
            // TODO: best would be if the widget would have a wrapper element around everything
            //       and the code in here finds all controller elements and hooks up events accordingly

            var $select = $(select);
            var $i = $select.prev('i');
            var $ul = $select.next('ul');

            var settings = $.extend({
                // These are the defaults.
                name: $select.attr('name')
            }, options );

            // use current selection in combobox and add input element to list
            function add_selection(event) {
                if ($ul.length == 0) {
                    $select.after("<ul></ul>");
                    $ul = $select.next('ul');
                }
                if ($ul.find('input[value="' + $select.val() + '"]').length == 0)
                    $ul.append('<li>' +
                               '<input type="hidden" name="' + settings.name + '" value="' +
                               $select.val() + '" /> ' +
                               $select.find('option:selected').text() +
                               '<a onclick="$(this).parent().remove();" class="btn pull-right" href="#"><i class="icon-remove"></i></a></li>');
            };
            // remove name attribute on original select
            // and disable multiselect to get a combobox
            $select.removeAttr('name multiple');

            // hook up events
            $i.click(add_selection);
            $select.change(add_selection);

        };

        return ({
            select_dataset: select_dataset,
            select_dataset_layers: select_dataset_layers,
            select_multi: select_multi
        });

});
