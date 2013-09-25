
// JS code to initialise the visualiser

window.bccvl || (window.bccvl = {});

window.bccvl.visualiser = {

    init: function() {
        try {
            this.visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
            console.log("Determined visualiser baseUrl: " + this.visualiserBaseUrl);
        } catch (err) {
            // swallow the exception (i.e. don't re-throw)
            console.warn(["Failed to determine visualiser base url", err]);
        }

        // find the visualiser debug button
        var $visualiserDebugButton = $('#visualiser_debug');

        var $vizOccurs = $('.bccvl-occurrence-viz');
        console.log($vizOccurs);

        $.each($vizOccurs, function(vIndex, occur) {
            // each occur should have a data-viz-id.. bail if it doesn't
            var $occur = $(occur);
            var id = $occur.attr('data-viz-id');
            if (!id) return;

            // attach some click behaviour to the thing
            $occur.click(function(evt) {

                console.log("here's where I'd look up " + id + " in the OCCURRENCES_MAP that Matthew has given us.");

                bccvl.visualiser.visualise(window.bccvl.lookups.occurrenceMap[id]);

                evt.preventDefault();
                return false;
            });
        });
    },

    visualise: function(dataId, options) {
        var opts = {    apiType: 'autodetect',
                        apiVersion: '1',
                        vizType: 'data_url_map'
        };
        // merge in the caller's options
        if (options) {
            for (var opt in options) { opts[opt] = options[opt]; }
        }

        console.log('viz got: ', dataId);

        frame = $('iframe.bccvl-viz');
        frame.attr('src', this.visualiserBaseUrl + 'api/' + opts.apiType + '/' + opts.apiVersion + '/' + opts.vizType + '?data_url=' + dataId);
    }

};
