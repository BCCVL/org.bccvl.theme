// FIXME: - document it
//        - should be configurable (api url?, apikey?)
//        - get rid of jquery dependency? (optional)
//        - simplify things, e.g. duplicate code for array parameter preparation
//        - usage examples with in/output?
//        - tests needed here?
(function(factory) {
    if (typeof exports === 'object') {
	// Node/CommonJS
        factory(require('jquery'));
    } else if (typeof define === 'function' && define.amd) {
	// AMD
        define(['jquery'], factory);        
    } else {
	// Browser globals
        // TODO: need to add return value to some global namespace (window.aekos for browser and whatever for nodejs (maybe) ?)
        window.aekos = factory(jQuery);
    }
}(function($) {

    var apiurl = "https://test.api.aekos.org.au/v2/";

    // Unquote string (utility)
    function unquote(value) {
        if (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') return value.substring(1, value.length - 1);
        return value;
    }

    // parse a link header
    function parseLinkHeader(header) {
        var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
        var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

        var matches = header.match(linkexp);
        var rels = new Object();
        for (i = 0; i < matches.length; i++) {
            var split = matches[i].split('>');
            var href = split[0].substring(1);
            var ps = split[1];
            var link = new Object();
            link.href = href;
            var s = ps.match(paramexp);
            for (j = 0; j < s.length; j++) {
                var p = s[j];
                var paramsplit = p.split('=');
                var name = paramsplit[0];
                link[name] = unquote(paramsplit[1]);
            }

            if (link.rel != undefined) {
                rels[link.rel] = link;
            }
        }

        return rels;
    }

    function getApiUrl() {
        return apiurl;
    };
    
    function getTraitVocab() {
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'getTraitVocab.json',
        }).promise();
    };

    // Get the json results with list of records
    function getDataPages(linkurl, params, methodType) {
        var request = $.Deferred();
        var newData = [];
        var retries = 0;
        var nexturl = linkurl;

        var getData = function(url){
            $.ajax({
                dataType: 'json',
                url: url,
                data: methodType == 'POST' ? JSON.stringify(params) : params,
                type: methodType
            })
            .done(function(data, textStatus, jqxhr){
                $.each(data, function(index, item) {
                        newData.push(item);
                });

                // Get the next url from the link header
                nexturl = '';
                retries = 0;
                var link = jqxhr.getResponseHeader('link');
                if (link) {
                    linkitem = parseLinkHeader(link)
                    if (linkitem["next"]) {
                        nexturl = linkitem["next"]["href"];
                    }
                }

                if (nexturl) {
                    getData(nexturl);
                } else {
                    // request is resolved when there is no next url in link header
                    request.resolve(newData);
                }
            })
            .fail(function(jqxhr, textStatus, errmsg){
                retries += 1;
                if (retries <= 3) {
                    getData(nexturl);
                } else {
                    alert("Error: Fail to get data from Aekos: " + nexturl);
                }
            });
        }

        getData(nexturl);
        return request;
    };

    // Get the json results with response and response-header.
    function getDataResponses(linkurl, params, methodType) {
        var request = $.Deferred();
        var newData = {};
        newData.response = [];
        newData.responseHeader  = {};
        var retries = 0;
        var nexturl = linkurl;

        var getData = function(url){
            $.ajax({
                dataType: 'json',
                url: url,
                data: methodType == 'POST' ? JSON.stringify(params) : params,
                type: methodType
            })
            .done(function(data, textStatus, jqxhr){
                $.each(data.response, function(index, item) {
                        newData.response.push(item);
                });
                newData.responseHeader = data.responseHeader;

                // Get the next url from the link header
                nexturl = '';
                retries = 0;
                var link = jqxhr.getResponseHeader('link');
                if (link) {
                    linkitem = parseLinkHeader(link)
                    if (linkitem["next"]) {
                        nexturl = linkitem["next"]["href"];
                    }
                }

                if (nexturl) {
                    getData(nexturl);
                } else {
                    // request is resolved when there is no next url in link header
                    request.resolve([newData]);
                }
            })
            .fail(function(jqxhr, textStatus, errmsg){
                retries += 1;
                if (retries <= 3) {
                    getData(nexturl);
                } else {
                    alert("Error: Fail to get data from Aekos: " + nexturl );
                }
            });
        }

        getData(nexturl);
        return request;
    };    

    function getSpeciesByTrait(traitName) {
        var data = {};
        if (traitName.constructor === Array) {
            data.traitNames = traitName;
        }
        else {
            data.traitNames = [traitName];
        }

        var url = apiurl + 'getSpeciesByTrait.json?pageSize=20';
        return getDataPages(url, data, 'POST');
    };


    function getTraitsBySpecies(speciesName) {
        var data = {};
        if (speciesName.constructor === Array) {
            data.speciesNames = speciesName;
        } else {
            data.speciesNames = [speciesName];
        }

        var url = apiurl + 'getTraitsBySpecies.json?pageSize=20';
        return getDataPages(url, data, 'POST');
   };

    function getEnvironmentBySpecies(speciesName) {
        var data = {};
        if (speciesName.constructor === Array) {
            data.speciesNames = speciesName;
        }
        else {
            data.speciesNames = [speciesName]
        }

        var url = apiurl + 'getEnvironmentBySpecies.json?pageSize=20';
        return getDataPages(url, data, 'POST');
    };

    function speciesSummary(speciesName) {
        var data = {};
        if (speciesName.constructor === Array) {
            data.speciesNames = speciesName;
        } else {
            data.speciesNames = [speciesName];
        }
        var url = apiurl + 'speciesSummary.json';
        return getDataPages(url, data, 'POST');
    };
    
    function speciesAutocomplete(q) {
        var url = apiurl + 'speciesAutocomplete.json?rows=200';
        return getDataPages(url, {'q': q}, 'GET');
    };

    function getTraitDataBySpecies(speciesArr, traitArr) {
        var data = {}
        if (speciesArr.constructor === Array) {
            data.speciesNames = speciesArr;
        }
        else {
            data.speciesNames = [speciesArr];
        }

        if (traitArr.constructor === Array) {
            data.traitNames = traitArr;
        } else {
            data.traitNames = [traitArr];
        }
        var url = apiurl + 'traitData.json?rows=20';
        return getDataResponses(url, data, 'POST');
    };

    function getTraitDataByEnviro(speciesArr, enviroArr) {
        var data = {};
        if (speciesArr.constructor === Array) {
            data.speciesNames = speciesArr;
        } else {
            data.speciesNames = [speciesArr];
        }
        if (enviroArr.constructor === Array) {
            data.varNames = enviroArr;
        } else {
            data.varNames = [enviroArr];
        }
        var url = apiurl + 'environmentData.json?rows=20';
        return getDataResponses(url, data, 'POST');
    };

    return {
        'getApiUrl': getApiUrl,
        'getTraitVocab': getTraitVocab,
        'getSpeciesByTrait': getSpeciesByTrait,
        'getTraitsBySpecies': getTraitsBySpecies,
        'getEnvironmentBySpecies': getEnvironmentBySpecies,
        'speciesAutocomplete': speciesAutocomplete,
        'speciesSummary': speciesSummary,
        'getTraitDataBySpecies': getTraitDataBySpecies,
        'getTraitDataByEnviro': getTraitDataByEnviro,
    }
    
}));
