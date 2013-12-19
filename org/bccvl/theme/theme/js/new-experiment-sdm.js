
//
// main JS for the new sdm experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation', 'js/bccvl-search', 'js/bccvl-form-validator'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          ,  fadeaway          ,  dimensions                  ,  search          ,  formvalidator ) {
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


            // -- layer selection -----------------------------------

            // this part was written in a hurry, my apologies for what lies within.

            var $envTable = $('table.bccvl-environmentaldatatable');
            var $envBody = $envTable.find('tbody');

            // here's some convenience functions we'll refer to below.  defining them
            // here saves us creating functions inside loops, which is Bad.

            // make a function to handle selection/deselection of a layer.
            var layerUpdate = function(parentId, layerId, checkBox) {
                var $checkBox = $(checkBox);

                // for now scrap all the fields and rebuild every time
                // TODO: do a more graceful update, rather than a burn down and rebuild

                // find the form
                var $form = $envTable.closest('form');
                // find the hidden field holder, delete it, and re-make it
                var $secretFields = $form.find('.bccvl-secretlayerselections');
                $secretFields.remove();
                $secretFields = $('<div class="hidden bccvl-secretlayerselections"></div>');
                $secretFields.appendTo($form);

                // now loop through each checked checkbox, make the hidden fields for each
                var $selectedLayers = $('input[name="bccvl-envlayer-selection"]').filter( function() {
                    // filter out the non-checked checkboxes
                    return $(this).prop('checked');
                });

                $selectedLayers.each( function(index, field) {
                    // now we're just each-ing through the layer checkboxes that are checked
                    var $field = $(field);
                    $secretFields.append(
                        '<select name="form.widgets.environmental_layers.key.' + index + ':list">' +
                        '<option value="' + $field.attr('value') + '" selected="selected"></option>' +
                        '</select>' +
                        '<select name="form.widgets.environmental_layers.' + index + ':list">' +
                        '<option value="' + $field.closest('tr[data-envparent]').attr('data-envparent') + '" selected="selected"></option>' +
                        '</select>'
                    );
                });
                $secretFields.append('<input type="hidden" name="form.widgets.environmental_layers.count" value="' + $selectedLayers.length + '" />');
            }

            // make a function to render a layer row.
            var renderLayerRow = function(parentId, layerId, friendlyNames) {
                var html = '';
                // TODO: this should be a template in the HTML.  Gotta get it working today so
                // it's not, but trust that Daniel is very embarrassed at doing this and should
                // be mocked next time you see him.

                html += '<tr data-envparent="' + parentId + '">';
                    // checkbox for selecting the layer
                    html += '<td><input type="checkbox" name="bccvl-envlayer-selection"  id="layer-' + parentId + '-' + layerId + '" value="' + layerId + '" ';
                    html += 'class="parsley-validated" parsley-mincheck="1" parsley-group="environmental_dataset" parsley-error-message="Please select at least one environmental dataset" '
                    html += '/></td>';
                    html += '<td><label for="layer-' + parentId + '-' + layerId + '">' + friendlyNames[layerId] + '</label></td>'; // name the layer
                    // viz button to viz the layer (and whatever other actions eventually go here)
                    html += '<td class="bccvl-table-controls"><a class="fine"><i class="icon-eye-open" title="view this layer"></i></a></td>';
                html += '</tr>';
                var $html = $(html);

                // now attach some behaviour, here in the JS where nobody can see wtf is going on. TODO move to somewhere else..?
                // here's where we hook up the viz
                var $vizButton = $html.find('.bccvl-table-controls i.icon-eye-open');
                $vizButton.click(function(evt) {
                    viz.visualise(parentId, $vizButton); // the parentId (datasetId) isn't enough, TODO: talk to Robert about it
                    evt.preventDefault();
                });

                var $layerSelect = $html.find('input[name="bccvl-envlayer-selection"]');
                $layerSelect.change(function(evt) {
                    layerUpdate(parentId, layerId, $layerSelect);
                });

                return $html;
            }

            // make a function that toggles between showing and hiding a dataset's layers
            var toggleEnvGroup = function(token, friendlyNames) {
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
                                    $.each(list.layers, function(layerId) {
                                        var name = friendlyNames[layerId];
                                        layerNames.push(name);
                                        layers[name] = renderLayerRow(token, layerId, friendlyNames);
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
            }

            // Now to the real work.
            // First we get friendly names for the environment layer data sources. They're at /dm/getVocabulary?name=envirolayer_source
            var friendlyNamesReq = $.ajax({ url: portal_url + '/dm/getVocabulary?name=envirolayer_source' });

            
            friendlyNamesReq.done( function(list) {
                var friendlyNames = {};
                $.each(list, function(index, value) {
                    friendlyNames[value.token] = value.title
                });

                // Next we have to ajax-fetch the possible layer-supplying datasets. They're at /dm/getVocabulary?name=environmental_datasets_source
                var dataTypeReq = $.ajax({ url: portal_url + '/dm/getVocabulary?name=environmental_datasets_source' });

                dataTypeReq.done( function(list) {
                    // we have the data, make it into table rows
                    $.each(list, function(index) {
                        var dataset = list[index];
                        $envBody.append('<tr data-envgroupid="' + dataset.token + '" class="bccvl-envgroup info"><td><i class="icon-plus"></i></td><td colspan="2">' + dataset.title + '</td></tr>');
                        //if they click inside this row, toggle it.
                        $envBody.find('[data-envgroupid=' + dataset.token + ']').click(function() {
                            toggleEnvGroup(dataset.token, friendlyNames);
                        });
                    });
                });
                dataTypeReq.fail( function(jqxhr, status) {
                    // we couldn't fetch the dataset list.  This is catastrophic.
                    alert('Could not fetch list of environmental datasets.  Please reload page to try again.');
                });
            });
            friendlyNamesReq.fail( function(jqxhr, status) {
                // we couldn't fetch the friendly names for the environment layer data sources.
                alert('Could not fetch friendly names of environmental datasets. Please reload page to try again.')
            });


            

        });
    // ==============================================================
    }
);
