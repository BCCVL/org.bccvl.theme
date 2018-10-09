// JavaScript code for the `data-exploration` experiment results tab

define(['jquery', 'bccvl-visualiser-common'],
    function($, vizcommon) {
        /**
         * Represents preview pane resource's content UUID and the button
         * used to open it
         */
        var previewPaneResource = {
            /** @type {undefined | string} */
            __uuid: undefined,

            /** @type {undefined | jQuery} */
            __button: undefined,

            clear: function() {
                this.clearUuid();
                this.clearButton();
            },

            set: function(uuid, button) {
                this.setUuid(uuid);
                this.setButton(button);
            },

            getUuid: function() {
                return this.__uuid;
            },

            /**
             * @param {string} uuid 
             */
            setUuid: function(uuid) {
                this.__uuid = uuid;
            },

            clearUuid: function() {
                this.__uuid = undefined;
            },

            getButton: function() {
                return this.__button;
            },

            /** @type {jQuery} */
            setButton: function(button) {
                this.__button = button;
            },

            clearButton: function() {
                this.__button = undefined;
            },

            setButtonClassEyeClosed: function() {
                $("i", this.__button)
                    .removeClass("icon-eye-open")
                    .addClass("icon-eye-close");
            },

            setButtonClassEyeOpen: function() {
                $("i", this.__button)
                    .addClass("icon-eye-open")
                    .removeClass("icon-eye-close");
            }
        }

        //#region On document ready
        $(function() {
            var $previewPane = $(".bccvl-preview-pane");

            // Click handler for the preview button (eye icon)
            $("body").on("click", "a.bccvl-data-exploration", function(e) {
                e.preventDefault();

                // Get the reference to the <a> tag in question
                var $this = $(this);

                // Pull out information about the resource being previewed
                /** @type {string} */
                var uuid = $this.data("uuid");
                /** @type {string} */
                var resourceUrl = $this.prop("href");
                /** @type {string} */
                var type = $this.data("mimetype");

                // If some button previously set, we toggle the class to reset
                // it to the original state
                if (previewPaneResource.getButton() !== undefined) {
                    previewPaneResource.setButtonClassEyeOpen();
                }

                // If this UUID is the same as the currently opened exploration
                // UUID, then close resource
                if (previewPaneResource.getUuid() === uuid) {
                    closeResource();

                    // Wipe tracked information for preview pane
                    previewPaneResource.clear();

                    return;
                }

                // Otherwise, proceed to open the resource (either as new or
                // overwriting previous one)
                openResource(uuid, resourceUrl, type);

                // Keep track of which resource, and set button to "eye closed"
                previewPaneResource.set(uuid, $this);
                previewPaneResource.setButtonClassEyeClosed();
            });

            function closeResource() {
                // Simply clear preview pane
                // TODO: More sophisticated closing of resource?
                $previewPane.empty();
            }

            /**
             * @param {string} uuid
             * @param {string} resourceUrl
             * @param {string} type
             */
            function openResource(uuid, resourceUrl, type) {
                // Overwrite the contents of the preview pane with a new
                // container
                //
                // We need to uniquely identify the element here with some
                // externally readable ID for `vizcommon` rendering functions
                var id = "data_exploration_plot_" + uuid;
                var $container = $("<div>", { id: id });

                // We need to inject the container now because `viscommon`
                // functions don't use direct DOM references and instead look
                // for element again :(
                $previewPane
                    .empty()
                    .append($container);

                // Render contents of resource depending on type
                //
                // NOTE: Below types copied from `bccvl-visualiser-map.js` and
                // streamlined into switch block
                switch (type) {
                    case "image/png":
                        vizcommon.renderPng(uuid, resourceUrl, id);
                        break;

                    case "text/csv":
                        vizcommon.renderCSV(uuid, resourceUrl, id, { mimeType: type });
                        break;

                    case "text/x-r-transcript":
                    case "application/json":
                    case "text/plain":
                    case "text/x-r":
                    case "application/x-perl":
                        vizcommon.renderCode(uuid, resourceUrl, id);
                        break;
                        
                        case "application/pdf":
                        vizcommon.renderPDF(uuid, resourceUrl, id);
                        break;

                    default:
                        // For other resources, go to resource?
                        window.location.href = resourceUrl;
                }
            }
        });
        //#endregion
    }
);
