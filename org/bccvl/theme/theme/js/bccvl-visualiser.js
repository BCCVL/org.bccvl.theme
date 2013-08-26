
// JS code to initialise the visualiser

window.bccvl || (window.bccvl = {});

window.bccvl.visualiser = {

    init: function() {
        var visualiserBaseUrl = undefined;

        try {
            visualiserBaseUrl = window.bccvlConfig.visualiser.baseUrl;
            console.log("Determined visualiser baseUrl: " + visualiserBaseUrl);
        } catch (err) {
            // swallow the exception (i.e. don't re-throw)
            console.error("Failed to determine visualiser base url");
        }

        // find the visualiser debug button
        var $visualiserDebugButton = $('#visualiser_debug');
    }

};
