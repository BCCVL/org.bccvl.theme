
//
// main JS for the new sdm experiment page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs',
     'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation',
     'js/bccvl-search', 'js/bccvl-form-validator'],
    function($, viz, wiztabs, stretch, fadeaway, dimensions, search, formvalidator ) {
        // ==============================================================
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();             // init the visualiser
            fadeaway.init();        // init the fadeaway instructions
            dimensions.init();      // init the dimension chooser thingy
            wiztabs.init();         // hook up the wizard buttons
            search.init();          // hook up the search fields

            // -- hook up algo config -------------------------------
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.

            var $algoCheckboxes = $('input[name="form.widgets.functions:list"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);
                // when the checkbox changes, update the config block's visibility
                $checkbox.change( function(evt) {
                    var $algoCheckbox = $(evt.target);
                    // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.
                    var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
                        } else {
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

            // -- absences + random --------------------------------
            $("#form-widgets-species_number_pseudo_absence_points").attr('disabled', 'disabled');
            $("#form-widgets-species_pseudo_absence_points-0:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("input[id^='form-widgets-species_absence_dataset-']").prop('checked', false);
                    $("#form-widgets-species_number_pseudo_absence_points").removeAttr('disabled');
                }
                else {
                    $("#form-widgets-species_number_pseudo_absence_points").attr('disabled', 'disabled');
                }
            });

            $("input[id^='form-widgets-species_absence_dataset-']").change(function() {
                $("#form-widgets-species_pseudo_absence_points-0:checkbox").prop('checked', false);
                $("#form-widgets-species_number_pseudo_absence_points").attr('disabled', 'disabled');
            });

            // -- layer selection -----------------------------------

            var $envTable = $('table.bccvl-environmentaldatatable');
            var $envBody = $envTable.find('tbody');

            // here's some convenience functions we'll refer to below.  defining them
            // here saves us creating functions inside loops, which is Bad.

            // make a function to handle selection/deselection of a layer.
            var layerUpdate = function(parentId, layerId, checkBox) {
                var $checkBox = $(checkBox);

                var $secretCountField = $('#environmental_layers_count');
                var currentCount = parseInt($secretCountField.attr('value'));

                // This is purely so we can do validation, to ensure at least n checkboxes are checked.
                if ($checkBox.prop('checked')) {
                    $secretCountField.attr('value', currentCount + 1);
                } else {
                    $secretCountField.attr('value', currentCount - 1);
                }

                // Count how many checkboxes are selected in the given climate layer
                var $layerSelectedField = $('#form-widgets-environmental_datasets-' + parentId + '-select');
                var numSelected = $('input[name="form.widgets.environmental_datasets.' + parentId + ':list"]:checked').length;

                // Enable/disable the climate layer accordingly
                $layerSelectedField.attr('value', numSelected == 0 ? '' : parentId);

                // Force a validation
                $secretCountField.parsley('validate');
            };

            // make a function to render a layer row.
            var renderLayerRow = function(parentId, layerId, friendlyName, fileName, zipFile) {

                // Build id and name
                var id = parentId + '_' + layerId;
                var name = 'form.widgets.environmental_datasets.' + parentId + ':list';

                var html = '';
                html += '<tr data-envparent="' + parentId + '">';
                // checkbox for selecting the layer
                html += '<td><input type="checkbox" id="' + id + '" name="' + name + '" value="' + layerId + '" data-friendlyname="checkbox_climatelayer_' + friendlyName + '"';
                html += '/></td>';
                html += '<td><label for="' + id + '">' + friendlyName + '</label></td>';
                // viz button to viz the layer (and whatever other actions eventually go here)
                html += '<td class="bccvl-table-controls"><a class="fine"><i class="icon-eye-open icon-link" title="view this layer"></i></a></td>';
                html += '</tr>';
                var $html = $(html);

                // now attach some behaviour, here in the JS where nobody can see wtf is going on. TODO move to somewhere else..?
                // here's where we hook up the viz
                var $vizButton = $html.find('.bccvl-table-controls i.icon-eye-open');
                $vizButton.click(function(evt) {
                    var params = {
                        file_name: fileName
                    };
                    viz.visualise(zipFile, $vizButton, null, params);
                    evt.preventDefault();
                });

                var $layerSelect = $html.find('input[name="' + name + '"]');
                $layerSelect.change(function(evt) {
                    layerUpdate(parentId, layerId, $layerSelect);
                });

                return $html;
            };

            // make a function that toggles between showing and hiding a dataset's layers
            var toggleEnvGroup = function(token) {
                // find the group header
                var $header = $('[data-envgroupid=' + token + ']');
                if ($header.length > 0) {
                    if ($header.hasClass('bccvl-open')) {
                        // it was open, so close it
                        $header.find('i.icon-minus').removeClass('icon-minus').addClass('icon-plus');
                        $header.removeClass('bccvl-open');
                        // hide all the layer rows
                        $header.parent().find('tr[data-envparent=' + token + ']').addClass('hidden');
                    } else {
                        // it's not open, so open it
                        $header.find('i.icon-plus').removeClass('icon-plus').addClass('icon-minus');
                        $header.addClass('bccvl-open');

                        // got any child rows?
                        var $layerRows = $header.parent().find('tr[data-envparent=' + token + ']');
                        if ($layerRows.length > 0) {
                            // already fetched the layers. just show them
                            $layerRows.removeClass('hidden');
                        } else {
                            // fetch metadata for this dataset, to see what env layers it holds
                            var layerReq = $.ajax({ url: portal_url + '/dm/getMetadata?datasetid=' + token });
                            layerReq.done( function(list) {
                                if (list.layers) {
                                    // collect layers by name (for sorting them)
                                    var layerNames = [];
                                    var layers = {};
                                    // render each layer
                                    $.each(list.layers, function(key, value) {
                                        var name = value.label;
                                        var fileName = value.filename;
                                        var zipFile = list.file;
                                        layerNames.push(name);
                                        layers[name] = renderLayerRow(token, key, name, fileName, zipFile);
                                    });
                                    // now sort the names and add them in order
                                    layerNames.sort();
                                    // gotta be reverse order, coz we add each successive one in right after the $header
                                    for(var index = layerNames.length - 1; index >= 0; index--) {
                                        $header.after(layers[layerNames[index]]);
                                    }
                                } else {
                                    alert('There are no layers in selected dataset.');
                                }
                            });
                            layerReq.fail( function(jqxhr, status) {
                                alert('Failed to get layers contained in selected dataset; status was "' + status + '", whatever that means.');
                            });
                        }
                    }
                }
            };

            // Wire up listeners to the climate layer boxes
            $('.bccvl-envgroup').click(function() {
                var envgroupid = $(this).attr('data-envgroupid');
                toggleEnvGroup(envgroupid);
            });
        });
        // ==============================================================
    }
);
