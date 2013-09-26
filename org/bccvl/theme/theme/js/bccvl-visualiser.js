
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


        var $vizOccurs = $('.bccvl-occurrence-viz');

        $.each($vizOccurs, function(vIndex, occur) {
            // each occur should have a data-viz-id.. bail if it doesn't
            var $occur = $(occur);
            var id = $occur.attr('data-viz-id');
            if (!id) return;

            // attach some click behaviour to the thing
            $occur.click(function(evt) {
                bccvl.visualiser.visualise(window.bccvl.lookups.occurrencesMap[id].file, $occur, { apiType: 'point'});
                evt.preventDefault();
                return false;
            });
        });

        var $vizRasters = $('.bccvl-raster-viz');
        $.each($vizRasters, function(vIndex, raster) {
            // each raster should have a data-viz-id.. bail if it doesn't
            var $raster = $(raster);
            var id = $raster.attr('data-viz-id');
            if (!id) return;

            // attach some click behaviour to the thing
            $raster.click(function(evt) {
                bccvl.visualiser.visualise(id, $raster, { apiType: 'raster'});
                evt.preventDefault();
                return false;
            });
        });

    },

    visualise: function(dataId, vizElement, options) {
        var opts = {
            apiType: 'autodetect',
            apiVersion: '1',
            vizType: 'data_url_map',
        };
        // merge in the caller's options
        if (options) {
            for (var opt in options) { opts[opt] = options[opt]; }
        }

        var $vizFrame = $(vizElement);
        if (! $vizFrame.is('iframe')) {
            // if the vizElement isn't an iframe, find the closest iframe
            $vizFrame = $(vizElement).closest('.tab-pane').find('iframe.bccvl-viz'); // TODO: don't assume tabs
        }

        $vizFrame.attr('src', this.visualiserBaseUrl +
            'api/' + encodeURIComponent(opts.apiType) +
            '/' + encodeURIComponent(opts.apiVersion) +
            '/' + encodeURIComponent(opts.vizType) +
            '?data_url=' + encodeURIComponent(dataId)
        );
    }

};
