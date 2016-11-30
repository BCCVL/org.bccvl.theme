

define(
    ['jquery', 'selectize', 'selectize-remove-single'],
    function( $ ) {

        function init_region_selector() {

            var select_type, $select_type;
            var select_region, $select_region;

            $select_type = $('#select-region-type').selectize({
                onChange: function(value) {
                    var xhr;
                    if (!value.length) return;
                    select_region.disable();
                    select_region.clearOptions();
                    select_region.load(function(callback) {
                        xhr && xhr.abort();
                        xhr = $.ajax({
                            url: '/_spatial/ws/field/' + value,
                            success: function(data) {
                                select_region.enable();
                                
                                var results = [];
                                
                                $.each(data.objects, function (key, feature) {
                                    
                                    var match = {
                                        'name': feature.name,
                                        'pid': feature.pid
                                    }
                                    results.push(match);
                                });
                                callback(results);
                            },
                            error: function() {
                                callback();
                            }
                        })
                    });
                }
            });

            $select_region = $('#select-region').selectize({
                valueField: 'pid',
                labelField: 'name',
                searchField: ['name'],
                onChange: function(value){
                    $.ajax({
                        url: '/_spatial/ws/shape/geojson/' + value,
                        success: function(result) {
                            // have to clean up ALA's geojson format
                            var geojson = {
                                'type': 'Feature',
                                'geometry': result
                            }
                            $('#selected-geojson').data('geojson', JSON.stringify(geojson));
                        },
                        error: function(error) {
                            console.log(error);
                        }
                    })
                }
            });

            select_region  = $select_region[0].selectize;
            select_type = $select_type[0].selectize;

            select_region.disable();

        }


        // msdm , false
        function init_algorithm_selector(selector, multi) {
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.
            var $algoCheckboxes = $(selector);
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);

                // when the checkbox changes, update the config block's visibility
                $checkbox.change(function(evt) {
                    var $algoCheckbox = $(evt.target);
                    // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.

                    if (!multi) {
                        // for single select we have to deactivate all other config blocks
                        var $visibleBlocks = $('#algoConfig .accordion-group:visible');
                        $.each($visibleBlocks, function(index, configBlock) {
                            var $configBlock = $(configBlock);
                            var $accordionBody = $configBlock.find('.accordion-body');
                            var $accordionToggle = $configBlock.find('.accordion-toggle');
                            // make sure that the accordion closes before hiding it
                            if ($accordionBody.hasClass('in')) {
                                $accordionBody.collapse('hide');
                                $accordionToggle.addClass('collapsed');
                                $accordionBody.removeClass('in');
                            }
                            // This is to avoid validation thinking that there are validation errors on algo conifg items that have been
                            // deselected - so we put the default value back into the text field when deselected.
                            $.each($configBlock.find('input[type="number"], input[type="text"]'), function(i, c) {
                                $(c).val($(c).attr('data-default'));
                            });
                            
                            $configBlock.hide(250);
                        });
                    }

                    // make selected config block visible
                    var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                    var $accordionBody = $configBlock.find('.accordion-body');
                    var $accordionToggle = $configBlock.find('.accordion-toggle');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
                            // By default, pa strategy is random when no pseudo absence data. Otherwise is none i.e. do not generate pseudo absence points.
                            $('select[name="form.widgets.' + $algoCheckbox.attr('value') + '.pa_strategy:list"]').val($('#have_absence').checked ? 'none' : 'random');
                        } else {
                            // make sure that the accordion closes before hiding it
                            if ($accordionBody.hasClass('in')) {
                                $accordionBody.collapse('hide');
                                $accordionToggle.addClass('collapsed');
                                $accordionBody.removeClass('in');
                            }
                            // This is to avoid validation thinking that there are validation errors on algo conifg items that have been
                            // deselected - so we put the default value back into the text field when deselected.
                            $.each($configBlock.find('input[type="number"], input[type="text"]'), function(i, c) {
                                $(c).val($(c).attr('data-default'));
                            });

                            $configBlock.hide(250);
                        }
                    } else {
                        if (console && console.log) {
                            console.log("no config block located for algorithm/function '" + $algoCheckbox.attr('value') + "'");
                        }
                    }
                });
                // finally, invoke the change handler to get the inital visibility sorted out.
                $checkbox.change();
            });

            // hookup all/none buttons/links
            $algoCheckboxes.parents('table').on('click', 'a.select-all', function() {
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', 'checked').trigger('change');
            })

            $algoCheckboxes.parents('table').on('click', 'a.select-none', function() {
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', false).trigger('change'); 
            })
            
        }
        return {
            init_region_selector: init_region_selector,
            init_algorithm_selector: init_algorithm_selector,
        }
    }
)

       
