
// JS code to catch a form sumission and display the fields.

window.initVisualiser = function() {

    // find the visualiser debug button
    var $visualiserDebugButton = $('#visualiser_debug');
    var visualiserBaseUrl = undefined;

    try {
        visualiserBaseUrl = window.bccvlConfig.visualiser.baseUrl;
        console.log("Determined visualiser baseUrl: " + visualiserBaseUrl);
    } catch (err) {
        console.error("Failed to determine visualiser base url");
        throw err;
    }

}
