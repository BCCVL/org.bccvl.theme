; (function() {
    // Freshchat 

    // Config
    var token = "93b8bda4-1f6d-48c4-9681-613f7fddb96b";

    // Inject script
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://wchat.freshchat.com/js/widget.js";

    script.onload = function() {
        // Init Freshchat widget
        window.fcWidget.init({
            token: token,
            host: "https://wchat.freshchat.com"
        });
    }

    if (document.readyState === "complete" || document.readyState === "loaded") {
        document.body.appendChild(script);
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            document.body.appendChild(script);
        });
    }
})();
