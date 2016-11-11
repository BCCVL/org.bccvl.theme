(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD
      define(['jquery'], factory);
  } else if (typeof exports === 'object') {
      // CommonJS
      module.exports = factory(require('jquery'));
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
    
    // Site Methods
    function vocabulary(name, root=false) {
        var api_path = 'API/dm/v1/vocabulary'
        if (root) {
            api_path = '/' + api_path
        }
        var api_url = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax({
            url: api_url,
            data: {name: name}
        }).promise()
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
        var api_path = 'API/em/v1/submitsdm'
        if (root) {
            api_path = '/' + api_path
        }
        var api_url = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax({
            url: api_url,
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(params)
        }).promise()
    }

    function submitcc(params, root=false) {
        /* params:
               title
               description
               species_distribution_models
               future_climate_datasets
               projection_region
        */
        var api_path = 'API/em/v1/submitcc'
        if (root) {
            api_path = '/' + api_path
        }
        var api_url = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax({
            url: api_url,
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(params)
        }).promise()
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
        var api_path = 'API/em/v1/submittraits'
        if (root) {
            api_path = '/' + api_path
        }
        var api_url = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax({
            url: api_url,
            type: "POST",
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(params)
        }).promise()
    }

    function em_metadata(uuid, root=false) {
        var api_path = 'API/em/v1/metadata'
        if (root) {
            api_path = '/' + api_path
        }
        var api_url = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax({
            url: api_url,
            type: 'GET',
            dataType: 'xml json',
            converters: {'xml json': $.xmlrpc.parseDocument},
            data: {uuid: uuid}
        }).promise()
    }

    // Datamanager calls
    function dm_metadata(uuid, root=false) {
        var api_path = 'API/dm/v1/metadata'
        if (root) {
            api_path = '/' + api_path
        }
        // TODO: should we use portal_url here?
        var api_url = _concatAndResolveUrl(window.location.href, api_path)
        return $.ajax({
            url: api_url,
            type: 'GET',
            dataType: 'xml json',
            converters: {'xml json': $.xmlrpc.parseDocument},            
            data: {uuid: uuid}
        }).promise()
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
            metadata: em_metadata
        },
        dm: {
            metadata: dm_metadata
        },
        job: {
        }
    }
        
}));