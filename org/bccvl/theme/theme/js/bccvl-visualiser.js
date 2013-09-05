
// JS code to initialise the visualiser

window.bccvl || (window.bccvl = {});

window.bccvl.visualiser = {

    init: function() {
        try {
            this.visualiserBaseUrl = window.bccvlConfig.visualiser.baseUrl;
            console.log("Determined visualiser baseUrl: " + this.visualiserBaseUrl);
        } catch (err) {
            // swallow the exception (i.e. don't re-throw)
            console.error("Failed to determine visualiser base url");
        }

        // find the visualiser debug button
        var $visualiserDebugButton = $('#visualiser_debug');

    }

    visualise: function(dataId) {
        frame = $('iframe.bccvl-viz');
        frame.attr(src, this.visualiserBaseUrl + 'api/raster/1/data_url_map?data_url=https://192.168.100.100/_debug/bccvl/experiments/asdf/result/current.tif/@@download/file/current.tif');
    }

};
