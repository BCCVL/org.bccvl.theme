(function() {
    // Freshchat

    // Config
    var token = "93b8bda4-1f6d-48c4-9681-613f7fddb96b";

    var prechatFormTemplate = {
        mainbgColor: "#45a4ec",
        maintxColor: "#fff",
        textBanner:
            "We can't wait to talk to you. Before we begin, please take a couple of moments to tell us a bit about yourself.",
        heading: "BCCVL Support Chat",
        SubmitLabel: "Start chat",
        fields: {
            field: {
                type: "name",
                label: "Name",
                fieldId: "name",
                required: "yes",
                error: "Please enter your name",
            },
            field2: {
                type: "email",
                label: "Email",
                fieldId: "email",
                required: "yes",
                error: "Please enter a valid email address",
            },
        },
    };

    // Settings for Freshchat
    // NOTE: This must be attached to the global `window` object
    window.fcSettings = {
        token: token,
        host: "https://wchat.freshchat.com",
        config: {
            cssNames: {
                widget: "custom_fc_frame",
                expanded: "custom_fc_expanded",
            },
        },
        onInit: function() {
            fcPreChatform.fcWidgetInit(prechatFormTemplate);
        },
    };

    // Inject script
    function createScript(url) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        return script;
    }

    var prechatFormScript = createScript(
        "https://snippets.freshchat.com/js/fc-pre-chat-form-v2.js",
    );

    var freshchatScript = createScript(
        "https://wchat.freshchat.com/js/widget.js",
    );

    function injectScripts(scripts) {
        function inject(i) {
            if (i >= scripts.length) {
                return;
            }

            var script = scripts[i];
            script.onload = function() {
                inject(++i);
            };
            document.body.appendChild(script);
        }

        inject(0);
    }

    if (
        document.readyState === "complete" ||
        document.readyState === "loaded"
    ) {
        injectScripts([prechatFormScript, freshchatScript]);
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            injectScripts([prechatFormScript, freshchatScript]);
        });
    }
})();
