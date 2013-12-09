
//
// main JS for the new sdm experiment page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs', 'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-dimension-equation', 'js/bccvl-search', 'parsley', 'bootstrap'],
    function( $      ,  viz                 ,  wiztabs              ,  stretch          ,  fadeaway          ,  dimensions                  ,  search          , parsley  ) {
    // ==============================================================
        $(function() {

            // hook up stretchers
            stretch.init({ topPad: 60, bottomPad: 10 });

            viz.init();         // init the visualiser
            fadeaway.init();    // init the fadeaway instructions
            dimensions.init();  // init the dimension chooser thingy
            wiztabs.init();     // hook up the wizard buttons
            search.init();      // hook up the search fields

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
                        console.log("no config block located for algorithm/function '" + $algoCheckbox.attr('value') + "'");
                    }
                });
                // finally, invoke the change handler to get the inital visibility sorted out.
                $checkbox.change();
            });

            // -- form validation -----------------------------------

            // TODO: most of this is pretty general, it should be in a
            // bccvl-form-validate.js file or something.

            // since we're pulling config blocks wholesale from plone, which sucks but is
            // quick to get working, we have to work around a bunch of plone's document
            // strutures and classes.  The easiest way to make validation errors show up
            // is to give plone's ".object-widget-field" things an additional class of
            // ".control-group".
            $('form.bccvl-parsleyvalidate .object-widget-field').addClass('control-group');

            // right, so now kick off parsley form validation on the forms..
            $('form.bccvl-parsleyvalidate').parsley({
                focus:        'none',       // don't switch focus to errors (we do that manually below)
                successClass: 'success',    // use these two Bootstrap classes for the error
                errorClass:   'error',      // and no-error states, and it'll look pretty.
                errors: {
                    // this error handling and elements make parsley errors Bookstrap friendly
                    classHandler: function(el) { return $(el).closest('.control-group'); },
                    container: function(el) {
                        var $controlGroup = $(el).closest('.control-group');
                        var $tableHeader = $controlGroup.find('th');
                        // if the element is in a table, use the table header..
                        if ($tableHeader.length > 0) return $tableHeader;
                        // otherwise use the controlGroup
                        return $controlGroup;
                    },
                    errorsWrapper: '<span class=\"help-inline bccvl-formerror\"></span>',
                    errorElem:     '<span></span>'
                },
                listeners: {
                    onFormValidate: function(isFormValid, evt) {
                        if (! isFormValid) {
                            // if the form isn't valid, then there's at least one error
                            // showing somewhere.  But if it's on another tab, parsley
                            // won't be able to focus that field.  So, here we're gonna
                            // find the first error indicator in the document, switch to
                            // its tab, then focus its field.
                            var $firstError = $('.control-group.error').first();  // first error

                            // show the tab holding the first error
                            var $tabPane = $firstError.closest('.tab-pane');      // tab pane containing first error
                            if ($tabPane.length > 0) {
                                // tab itself that belongs to the tab pane we're interested in
                                var $tabLink = $('a[data-toggle="tab"][href="#' + $tabPane.attr('id') + '"]');
                                if (! $tabPane.hasClass('active')) {
                                    // if that tab isn't already showing, show it
                                    $tabLink.tab('show');
                                }
                            }

                            // open the config accordion holding the first error
                            var $accordionPane = $firstError.closest('.accordion-group').find('.accordion-body');

                            console.log('first errors accord pane is', $accordionPane);

                            if ($accordionPane.length > 0) {
                                // if that pane isn't already showing, show it
                                $accordionPane.collapse('show');
                            }

                            // whether we had to flick the tab or not, focus the field
                            $firstError.find('input, select, textarea').first().focus();
                            return false;
                        } else {
                            return true;
                        }
                    }
                }
            });

            // -- layer selection -----------------------------------

            // so first we have to ajax-fetch the possible layer-supplying datasets.
            // They're at /dm/getVocabulary?name=environmental_datasets_source

            var $envTable = $('table.bccvl-environmentaldatatable');
            var $envBody = $envTable.find('tbody');

            // make a function to work out a layer name.   Best to do this here outside of any loops.
            var layerName = function(layerId, layerInfo) {
                // currently the layerInfo is just it's filename.  we'll extract a hopefully
                // human-recognisable name from that.
                // Let's get the substring from the last '/' to the last '.'
                var lastSlash = layerInfo.lastIndexOf('/');
                var lastDot = Math.min(layerInfo.lastIndexOf('.'), layerInfo.length);
                return layerInfo.substring(lastSlash + 1, lastDot); // bug here: might fail on 0-length strings?
            }

            // make a function to render a layer row.   Best to do this here outside of any loops.
            var renderLayerRow = function(parentId, layerId, layerInfo) {
                var html = '';
                // TODO: this should be a template in the HTML.  Gotta get it working today so
                // it's not, but trust that Daniel is very embarrassed at doing this and should
                // be mocked next time you see him.

                html += '<tr data-envparent="' + parentId + '">';
                    html += '<td></td>';
                    html += '<td>' + layerName(layerId, layerInfo) + '</td>';
                    html += '<td></td>';
                html += '</tr>';
                return $(html);
            }

            var toggleEnvGroup = function(token) {
                // find the group header
                var $header = $('[data-envgroupid=' + token + ']');
                if ($header.length > 0) {
                    if ($header.hasClass('bccvl-open')) {
                        // it was open, so close it
                        $header.find('i.icon-minus').removeClass('icon-minus').addClass('icon-plus');
                        $header.removeClass('bccvl-open');
                        // delete all the layer rows (yes this is terrible, we should hide them)
                        $header.parent().find('tr[data-envparent=' + token + ']').remove();
                    } else {
                        // it's not open, so open it
                        $header.find('i.icon-plus').removeClass('icon-plus').addClass('icon-minus');
                        $header.addClass('bccvl-open');

                        // fetch metadata for this dataset, to see what env layers it holds
                        var layerReq = $.ajax({ url: '/dm/getMetadata?datasetid=' + token });
                        layerReq.done( function(list) {
                            console.log('got em!', list.layers);
                            if (list.layers) {
                                // collect layers by name (for sorting them)
                                var layerNames = [];
                                var layers = {};
                                // render each layer
                                $.each(list.layers, function(layerId) {
                                    var name = layerName(layerId, list.layers[layerId]);
                                    console.log(name);
                                    layerNames.push(name);
                                    layers[name] = renderLayerRow(token, layerId, list.layers[layerId]);
                                });
                                // now sort the names and add them in order
                                layerNames.sort();
                                console.log(layerNames);
                                $.each(layerNames, function(name) {
                                    $header.after(layers[name]);
                                });
                            } else {
                                alert('There are no layers in selected dataset.');
                            }
                        });
                        layerReq.fail( function(jqxhr, status) {
                            console.log('failed to get layers for ' + token, status);
                        });
                    }
                }
            }

            // this is how you do jQuery ajax now.. it's all Promises and stuff.  We're living in the ~F~U~T~U~R~E~
            var dataTypeReq = $.ajax({ url: '/dm/getVocabulary?name=environmental_datasets_source' });

            dataTypeReq.done( function(list) {
                // we have the data, make it into table rows
                $.each(list, function(index) {
                    var dataset = list[index];
                    $envBody.append('<tr data-envgroupid="' + dataset.token + '" class="bccvl-envgroup info"><td><i class="icon-plus"></i></td><td colspan="2">' + dataset.title + '</td></tr>');
                    //if they click inside this row, toggle it.
                    $envBody.find('[data-envgroupid=' + dataset.token + ']').click(function() {
                        toggleEnvGroup(dataset.token);
                    });
                });
            });
            dataTypeReq.fail( function(jqxhr, status) {
                // we couldn't fetch the dataset list.  This is catastrophic.
                alert('Could not fetch list of environmental datasets.  Please reload page to try again.');
            });

        });
    // ==============================================================
    }
);
