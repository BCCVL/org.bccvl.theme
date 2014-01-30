
// JS code to initialise the visualiser

define(     ['jquery'],
    function( $      ) {

        var bccvl_visualiser = {

            init: function() {
                try {
                    this.visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
                    if (console && console.log) {
                        console.log("Determined visualiser baseUrl: " + this.visualiserBaseUrl);
                    }
                } catch (err) {
                    // swallow the exception (i.e. don't re-throw)
                    if (console && console.warn) {
                        console.warn(["Failed to determine visualiser base url", err]);
                    }
                }

                // This goes looking for viz buttons, and attaches a click event.
                // The buttons (or links or whatever) should look like this:
                // <button class=".bccvl-occurrence-viz" data-viz-id="http://<baseurl>/bccvl/<some path to the file>">

                // here's a list of all the viz-able things.   We'll loop through this below.
                // each item looks like this:
                //     'itemType': {                         # viz buttons should use a class name of '.bccvl-{itemType}-viz'
                //         apiType: 'vizApiName',            # [reqd] the API type the visualiser should use.
                //         resolveId: function(rawId) {...}  # [optional] function to re-map the ID from the DOM element to
                //                                           # the id that should be given to the vizualiser.
                //     }
                visualisableTypes = {
                    // - - - - - - - - - - - - - - - - - - - - -
                    'occurrence': {
                        apiType:   'point',
                        resolveId: function(rawId) {
                            if (window.bccvl.lookups) {
                                return window.bccvl.lookups.occurrencesMap[rawId].file;
                            } else {
                                return rawId;
                            }
                        }
                    },
                    // - - - - - - - - - - - - - - - - - - - - -
                    'absence': {
                        apiType:   'point',
                        resolveId: function(rawId) {
                            if (window.bccvl.lookups) {
                                return window.bccvl.lookups.occurrencesMap[rawId].file;
                            } else {
                                return rawId;
                            }
                        }
                    },
                    // - - - - - - - - - - - - - - - - - - - - -
                    'raster': {
                        apiType:   'raster',
                        resolveId: function(rawId) { return rawId; }
                    },
                    // - - - - - - - - - - - - - - - - - - - - -
                    'r': {
                        apiType:   'r',
                        resolveId: function(rawId) { return rawId; }
                    },
                    // - - - - - - - - - - - - - - - - - - - - -
                    'auto': {
                        apiType:   'auto_detect',
                        resolveId: function(rawId) { return rawId; }
                    },
                    // - - - - - - - - - - - - - - - - - - - - -
                }


                $.each(visualisableTypes, function(name, vizType) {
                    var $vizInvokers = $('.bccvl-' + name + '-viz');

                    $.each($vizInvokers, function(vIndex, invoker) {
                        // ideally this stuf would be in a separate, publically
                        // accessible function so you can en-vizualise an invoker
                        // by manually calling that function on a single item.
                        //
                        // This loop would just be calling that function on the
                        // invokers in the initial page.

                        // each invoker should have a data-viz-id.. bail if it doesn't
                        var $invoker = $(invoker);
                        var id = $invoker.attr('data-viz-id');
                        if (!id) return;

                        if (vizType.resolveId) {
                            id = vizType.resolveId(id);
                        }

                        $invoker.addClass('fine');

                        // attach some click behaviour to the thing
                        $invoker.click(function(evt) {
                            bccvl_visualiser.visualise(id, $invoker, { apiType: vizType.apiType });
                            evt.preventDefault();
                        });
                    });
                });
            },

            visualise: function(dataId, vizElement, options, params) {
                var opts = {
                    apiType: 'auto_detect',
                    apiVersion: '1',
                    vizType: 'default',
                };
                // merge in the caller's options
                if (options) {
                    for (var opt in options) { opts[opt] = options[opt]; }
                }

                var url = this.visualiserBaseUrl +
                    'api/' + encodeURIComponent(opts.apiType) +
                    '/' + encodeURIComponent(opts.apiVersion) +
                    '/' + encodeURIComponent(opts.vizType) +
                    '?data_url=' + encodeURIComponent(dataId);

                if (params) {
                    for (param in params) {
                        url = url + '&' 
                        + encodeURIComponent(param) + '=' 
                        + encodeURIComponent(params[param]);
                    }
                }

                var $vizFrame = $(vizElement);
                if (! $vizFrame.is('iframe')) {
                    // if the vizElement isn't an iframe, find the closest iframe
                    $vizFrame = $(vizElement).closest('.tab-pane, body').find('iframe.bccvl-viz'); // TODO: don't assume tabs
                }

                $vizFrame.attr('src', url);
            }
        }

        return bccvl_visualiser;
    }
);
