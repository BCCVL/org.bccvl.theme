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
        console.log(q);
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'speciesAutocomplete.json',
            data: {
                'q': q
            }
        }).promise();
    };

    function getTraitDataBySpecies(speciesArr, traitArr) {
        var data = [];
        if (speciesArr.constructor === Array) {
            var arrayLength = speciesArr.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'speciesName',
                           'value': speciesArr[i]});
            }
        } else {
            data.push({'name': 'speciesName',
                     'value': speciesArr});
        }
        if (traitArr.constructor === Array) {
            var arrayLength = traitArr.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'traitName',
                           'value': traitArr[i]});
            }
        } else {
            data.push({'name': 'traitName',
                     'value': traitArr});
        }
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'traitData.json',
            data: data
        }).promise();
    };

    function getTraitDataByEnviro(speciesArr, enviroArr) {
        var data = [];
        if (speciesArr.constructor === Array) {
            var arrayLength = speciesArr.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'speciesName',
                           'value': speciesArr[i]});
            }
        } else {
            data.push({'name': 'speciesName',
                     'value': speciesArr});
        }
        if (enviroArr.constructor === Array) {
            var arrayLength = enviroArr.length;
            for (var i = 0; i < arrayLength; i++) {
                data.push({'name': 'envVarName',
                           'value': enviroArr[i]});
            }
        } else {
            data.push({'name': 'envVarName',
                     'value': enviroArr});
        }
        return $.ajax({
            dataType: 'json',
            url: apiurl + 'environmentData.json',
            data: data
        }).promise();
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
