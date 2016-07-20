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

    var apiurl = "https://api.aekos.org.au/v1/";

    function getApiUrl() {
        return apiurl;
    };
    
    function getTraitVocab() {
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'getTraitVocab.json',
        }).promise();
    };

    function getSpeciesByTrait(traitName) {
        var data = [];
        if (traitName.constructor === Array) {
            var arrayLength = traitName.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'traitName',
                           'value': traitName[i]});
            }
        } else {
            data = [{'name': 'traitName',
                     'value': traitName}];
        }
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'getSpeciesByTrait.json',
            data: data
        }).promise();
    };

    function getTraitsBySpecies(speciesName) {
        var data = [];
        if (speciesName.constructor === Array) {
            var arrayLength = speciesName.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'speciesName',
                           'value': speciesName[i]});
            }
        } else {
            data = [{'name': 'speciesName',
                     'value': speciesName}];
        }
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'getTraitsBySpecies.json',
            data: data
        }).promise();
    };

    function getEnvironmentBySpecies(speciesName) {
        var data = [];
        if (speciesName.constructor === Array) {
            var arrayLength = speciesName.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'speciesName',
                           'value': speciesName[i]});
            }
        } else {
            data = [{'name': 'speciesName',
                     'value': speciesName}];
        }
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'getEnvironmentBySpecies.json',
            data: data
        }).promise();
    };

    function speciesSummary(speciesName) {
        var data = [];
        if (speciesName.constructor === Array) {
            var arrayLength = speciesName.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'speciesName',
                           'value': speciesName[i]});
            }
        } else {
            data = [{'name': 'speciesName',
                     'value': speciesName}];
        }
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'speciesSummary.json',
            data: data
        }).promise();
    }
    
    function speciesAutocomplete(q) {
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'speciesAutocomplete.json',
            data: {
                'q': q
            }
        }).promise();
    };

    return {
        'getApiUrl': getApiUrl,
        'getTraitVocab': getTraitVocab,
        'getSpeciesByTrait': getSpeciesByTrait,
        'getTraitsBySpecies': getTraitsBySpecies,
        'getEnvironmentBySpecies': getEnvironmentBySpecies,
        'speciesAutocomplete': speciesAutocomplete,
        'speciesSummary': speciesSummary
    }
    
}));
