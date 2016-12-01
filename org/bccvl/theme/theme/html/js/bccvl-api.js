(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD
      define(['jquery', 'jquery-xmlrpc'], factory);
  } else if (typeof exports === 'object') {
      // CommonJS
      module.exports = factory(require('jquery'), require('jquery-xmlrpc'));
  } else {
      // Browser globals (Note: root is window)
      root.returnExports = factory(root.jQuery);
  }
}(this, function ($) {

    // module global variables
    var settings = {}

    // helper methods
    function _concatAndResolveUrl(url, concat) {
        var url1 = url.split('/');
        var url2 = concat.split('/');
        var url3 = [ ];
        // url1:
        //    idx 0,1,2 make proto + host/port
        // url1 has proto host/path  and url2 starts with '/' ?
        if (url1.length >= 3
            && url2.length > 1 && url2[0] == "") {
            // absolute url ... strip down url1
            url1 = url1.slice(0,3)
        }
        // url does not end in '/' and concat does not start with '/'
        //   -> strip off last element in url2 (relative url)
        //   -> unless last part in url is hostname:port ?
        if (url1.length > 3 && url1[url1.length -1] != "" // has path and no trailing slash?
            && (url2.length > 1 && url2[0] != "") // does not start with / ?
           ) {
            url1.pop() // remove last element
        }
        // concat whatever is left?
        for (var i = 0, l = url1.length; i < l; i ++) {
            if (url1[i] == '..') {
                url3.pop();
            } else if (url1[i] == '.') {
                continue;
            } else {
                url3.push(url1[i]);
            }
        }
        for (var i = 0, l = url2.length; i < l; i ++) {
            if (url2[i] == '..') {
                url3.pop();
            } else if (url2[i] == '.') {
                continue;
            } else {
                url3.push(url2[i]);
            }
        }
        return url3.join('/');
    }

    function _do_call(api_path, ajax_options, root=false) {
        if (root) {
            api_path = '/' + api_path
        }
        ajax_options['url'] = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax(ajax_options).promise()
    }
    
    // Site Methods
    function vocabulary(name, root=false) {
        return _do_call(
            'API/dm/v1/vocabulary',
            {
                data: {name: name}
            },
            root
        )
    }
    
    // Experiment methos
    function submitsdm(params, root=false) {
        /* params:
               title
               description
               occurrence_data
               absence_data
               scale_down
               environmental_data
               modelling_region
               algorithms
        */
        return _do_call(
            'API/em/v1/submitsdm',
            {
                type: "POST",
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(params)
            },
            root
        )
    }

    function submitcc(params, root=false) {
        /* params:
               title
               description
               species_distribution_models
               future_climate_datasets
               projection_region
        */
        return _do_call(
            'API/em/v1/submitcc',
            {
                type: "POST",
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(params)
            },
            root
        )
    }
    
    function submittraits(params, root=false) {
        /* params:
               title
               description
               traits_data
               environmental_data
               modelling_region
               algorithms
        */
        return _do_call(
            'API/em/v1/submittraits',
            {
                type: "POST",
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(params)
            },
            root
        )
    }

    function em_metadata(uuid, root=false) {
        return _do_call(
            'API/em/v1/metadata',
            {
                type: 'GET',
                dataType: 'xml json',
                converters: {'xml json': $.xmlrpc.parseDocument},
                data: {uuid: uuid}
            },
            root
        ).then(
            function(data, status, jqXHR) {
                // deref xmlrpc result array
                return data[0]
            }
        )
    }

    function em_status(uuid, root=false) {
        return _do_call(
            'API/em/v1/status',
            {
                type: 'GET',
                dataType: 'json',
                contentType: 'application/json',
                data: {uuid: uuid}
            },
            root
        )
    }

    // Datamanager calls
    function dm_metadata(uuid, root=false) {
        return _do_call(
            'API/dm/v1/metadata',
            {
                type: 'GET',
                dataType: 'xml json',
                converters: {'xml json': $.xmlrpc.parseDocument},            
                data: {uuid: uuid}
            },
            root
        ).then(
            function(data, status, jqXHR) {
                // deref xmlrpc result array
                return data[0]
            }
        )
    }

    function dm_get_rat(uuid, layer, root=false) {
        return _do_call(
            'API/dm/v1/rat',
            {
                type: 'GET',
                dataType: 'json',
                contentType: 'application/json',
                data: {uuid: uuid, layer: layer}
            },
            root
        )
    }

    function dm_update_metadata(uuid, root=false) {
        return _do_call(
            'API/dm/v1/update_metadata',
            {
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({uuid: uuid})
            },
            root
        )
    }

    function export_to_ala(uuid, root=false) {
        return _do_call(
            'API/dm/v1/export_to_ala',
            {
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({uuid: uuid})
            },
            root
        )
    }

    function import_trait_data(data, root=false) {
        // TODO: should use json?
        return _do_call(
            'API/dm/v1/import_trait_data',
            {
                method: 'POST',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                data: data,
                traditional: true
            },
            root
        )
    }

    // Visualiser

    var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl
    var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms'
    var visualiserFetchUrl = visualiserBaseUrl + 'api/fetch'
    
    function visualiser_fetch(data) {
        var dfrd = $.Deferred()

        var fetch = function() {
            $.ajax({
                url: visualiserFetchUrl,
                data: data
            }).then(
                function(data, status, jqXHR) {
                    if(data.status == "COMPLETED"){
                        dfrd.resolve(data.status);
                    } else if (data.status == "FAILED"){
                        dfrd.reject(data.reason);
                    } else {
                        // fetch again
                        setTimeout(fetch, 500)
                    }
                }
            ).fail(
                function(jqXHR, textStatus, errorThrown) {
                    dfrd.reject(jqXHR)
                }
            )
        }

        fetch()

        return dfrd.promise()
    }
    
    
    // Exposed public methods
    return {
        site: {
            vocabulary: vocabulary
        },
        em: {
            submitsdm: submitsdm,
            submitcc: submitcc,
            submittraits: submittraits,
            metadata: em_metadata,
            status: em_status
        },
        dm: {
            metadata: dm_metadata,
            get_rat: dm_get_rat,
            update_metadata: dm_update_metadata,
            export_to_ala: export_to_ala,
            import_trat_data: import_trait_data
        },
        job: {
        },
        visualiser: {
            wms_url: visualiserWMS,
            fetch: visualiser_fetch
        }
    }

}));


// bccvl-search.js API reference ... should use bccvlapi

// TODO: load vocabulary may still be an ajax async issue ... do caching in bccvl-api? (visualiser-common)

// TODO: cleanup xmlrpc.py ... remove unused API methods like getRAT etc...
