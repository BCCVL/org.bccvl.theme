
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
            $occur.click(function() {
                console.log(id);
            });
        });
    },

    visualise: function(dataId) {
        console.log('viz got: ', dataId);
        frame = $('iframe.bccvl-viz');
        frame.attr('src', this.visualiserBaseUrl + 'api/raster/1/data_url_map?data_url=' + dataId);
    }

};
