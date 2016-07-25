
// JS code to initialise search "forms" in the DOM.
//
// Note they're not <form> tag forms.  Just divs (or some other
// tag type) that have a class of bccvl-search-form, and contain
// an <input> and a <select>.
// The <input> is where the user types their search string.  The
// <select> is where the user chooses where the results will come
// from.
// Somewhere in the DOM (it can be inside the search-form div, but
// doesn't have to be) you should locate another div (or section,
// or whatever container tag you like).  Give that div an id of
// "<the-same-id-as-your-form-div>_results" and a class of
// bccvl-searchform-results.  This code will use that div to
// display the results of the search.
//
// Search form example
// -------------------
// A search "form" example:
//
// <div class="bccvl-search-form" id="someIdForTheForm">
//     <input name="someIdForTheForm_query" ...>
//     <select name="someIdForTheForm_source">...</select>
// </div>
// <div id="someIdForTheForm_results" class="bccvl-searchform-results"></div>
//
// The parent tag (a div in the example above) needs an id.  The
// names of the <imput> and <select> tags need to be that id, plus
// _query (for the input) and _source (for the select).
//
// Search providers
// ----------------
// ...are defined in the bccvl.search.providers data object.  Each
// property of the bccvl.search.providers object looks like:
//
//  providerId: { // (defining bccvl.search.providers.providerId)
//
//      autocomplete: { // optional.
//              If provider.autocomplete is undefined, the system
//              won't try to autocomplete the user's search term.
//
//          url: function(searchString) // required.
//              Returns a url for autocomplete results given the
//              user's searchString.  Will be ajax-fetched.
//
//          parseData: function(data) // optional.
//              Will be provided with the data response from the
//              ajax call.  Should return an array of strings
//              that will be offered to the user as autocomplete
//              suggestions.
//              If autocomplete.parseData() not defined, the data
//              returned by the ajax call is assumed to already
//              be an array of autocomplete suggestion strings.
//
//          cleanItem: function(selectedItem) // optional.
//              Will be called with the item the user selected,
//              and should return the string that should be
//              inserted into the search box.  If you put markup
//              in the item strings, here's where you remove the
//              tags.
//              If autocomplete.cleanItem() is not defined, the
//              selected itemstring will be used directly.
//      },
//
//      search: { // required.
//
//          url: function(searchString) // required.
//              Returns a url for autocomplete results given the
//              user's searchString.  Will be ajax-fetched.
//
//      }
// }

define(     ['jquery', 'jquery-xmlrpc', 'bootstrap2'],
    function( $      ) {


        var bccvl_search = {
            // --------------------------------------------------------------
            // -- providers -------------------------------------------------
            // --
            // -- this providers config is how search providers are added.
            // -- The ALA and GBIF providers supply autocomplete and search examples,
            // -- if you follow those it will probably work as expected.
            // --------------------------------------------------------------
            providers: {
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                gbif: {
                    autocomplete: {
                        autoUrl: function(autocompleteString) {
                            return ('gbif/auto.json?q=' + encodeURIComponent(autocompleteString));
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseAutoData: function(rawData) {
                            var list = [];
                            if (rawData) {
                                $.each(rawData, function(index, item) {
                                    // each item in the autoCompleteList is a taxon.  so it
                                    // only needs to show up once in the suggestion list.
                                    if (typeof(item.rank) == 'undefined' || (item.rank != 'SPECIES' && item.rank != 'GENUS')) {
                                        return true;
                                    }
                                    var name = ' (' + item.rank + ')';
                                    name = name + ' <i>' + item.canonicalName + '</i>';
                                    list.push(name);
                                });
                            }
                            return list;
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        noResultsFound: function(reason) {
                            var $desc = $('.bccvl-labelfade-description');
                            if (reason){
                                $desc.html(reason);
                            }
                            else{
                                $desc.html('No Results Found');
                            }
                            $desc.show();
                            $desc.removeClass('bccvl-read');
                            $desc.addClass('bccvl-unread');
                            setTimeout(function() {
                                $desc.removeClass('bccvl-unread');
                                $desc.addClass('bccvl-read');
                            }, 5000);
                            setTimeout(function(){
                                $desc.hide();
                            }, 8000);
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        cleanAutoItem: function(selectedItem) {
                            // the string will always have <i>sciname</i> at the start, so..
                            return selectedItem.split(/<\/?i>/)[1];
                        }
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                    },
                    search: {
                        searchUrl: function(selectedItem, start, pageSize) {
                            startIndex = start || 0;
                            pageSize = pageSize || 10;
                            var splitItems = selectedItem.split(/<\/?i>/);
                            var rankSupplied = splitItems[0].split(/\((.*)\)/)[1];
                            var searchString = splitItems[1].replace(/\(|\)/g, '');

                            return ('gbif/search.json?name=' + encodeURIComponent(searchString) + '&start=' + startIndex + '&pageSize=' + pageSize);
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        searchSpeciesUrl: function(genusKey, start, pageSize) {
                            // To search for all the species belong to a given genus 
                            startIndex = start || 0;
                            pageSize = pageSize || 10;                            
                            return ('gbif/species.json?genusKey=' + encodeURIComponent(genusKey) + '&start=' + startIndex + '&pageSize=' + pageSize);
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        statusError: function(data) {                        
                            return !('results' in data)
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -                        
                        totalRecords: function(data) {
                            if (typeof(data.endOfRecords) != 'undefined' && !data.endOfRecords) {
                                return data.offset + (2 * data.limit);
                            }
                            return data.offset;
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseSearchData: function(rawData, searchString, excluded) {
                            var list = [];
                            if (rawData.results) {
                                var included = [];
                                var searchStringWords = searchString.toLowerCase().split(" ");
                                $.each(rawData.results, function(index, item) {

                                    // Skip if it is already included
                                    if (typeof(item.nubKey) == 'undefined' || $.inArray(item.nubKey, included) != -1) {
                                        // See the jQuery docs, this is like 'continue' inside a $.each (yeh!)
                                        return true;
                                    }

                                    // Skip if its status is not accepted
                                    if (typeof(item.taxonomicStatus) == 'undefined' || item.taxonomicStatus != 'ACCEPTED') {
                                        return true;
                                    }

                                    // Check if it is alreday included for import in other search
                                    if ($.inArray(item.nubKey, excluded) != -1) {
                                        return true;
                                    }                                    

                                    // Skip if rank is undefined. Only interested in species or genus
                                    if (typeof(item.rank) == 'undefined' || (item.rank != 'SPECIES' && item.rank != 'GENUS'))
                                    {
                                        return true;
                                    }

                                    // build the proper data object
                                    result = { title: "", description: "", actions: {}, friendlyname: "", rank: "", genus: "", family: "" };
                                    result.title = item.scientificName;
                                    result.friendlyname = item.scientificName;
                                    result.rank = item.rank;
                                    result.genus = item.genus;
                                    result.family = item.family;
                                    result.nubKey = item.nubKey;
                                    result.genusKey = item.genusKey;
                                    
                                    if (item.vernacularName) {
                                        result.title = item.vernacularName + ' <i class="taxonomy">' + item.scientificName + '</i>';
                                        result.friendlyname = item.vernacularName + ' ' + item.scientificName;
                                    }

                                    if (item.nubKey) {

                                        included.push(item.nubKey);
                                        excluded.push(item.nubKey);
                                    } 

                                    if (item.rank) {
                                        result.description += ' (' + item.rank + ')';
                                    }

                                    // now get the actions sorted. For GBIF, lsid is the taxonKey/nubKey i.e. speciesKey, genusKey
                                    if (item.nubKey) {
                                        var gbifImportArgs = '?import=Import&';
                                        gbifImportArgs += 'lsid=' + encodeURIComponent(item.nubKey) + "&";
                                        gbifImportArgs += 'taxon=' + encodeURIComponent(item.scientificName) + "&";
                                        gbifImportArgs += 'searchOccurrence_source=' + encodeURIComponent('gbif');

                                        result.actions.viz = 'http://www.gbif.org/species/' + encodeURIComponent(item.nubKey);
                                        result.actions.alaimport = document.URL + gbifImportArgs;
                                    }
                                    list.push(result);
                                });
                            }
                            return list;
                        },
                        // --------------------------------------------------------------
                        getData: function(nextIndex, selectedItem) {
                            // Get species data from GBIF 
                            var pageSize = 10;
                            var searchUrl = bccvl_search.providers.gbif.search.searchUrl(selectedItem, nextIndex, pageSize);
                            $('.bccvl-results-spinner').css('display', 'block');
                                
                            return $.ajax({
                                    dataType: 'jsonp',
                                    url: searchUrl,
                                    timeout: 60000
                                });
                        },                        
                        // --------------------------------------------------------------
                        getGenusSpecies: function(genusKey, nextIndex) {
                            var pageSize = 10;
                            var surl = bccvl_search.providers.gbif.search.searchSpeciesUrl(genusKey, nextIndex, pageSize);
                            $('.bccvl-results-spinner').css('display', 'block');
                                
                            return $.ajax({
                                    dataType: 'jsonp',
                                    url: surl,
                                    timeout: 60000
                                });
                        },
                        // --------------------------------------------------------------                                                
                        importGenusDatasets: function(searchString, excluded) {
                            var pageSize = 40;
                            var endOfRecords = false;

                            var $resultTable = $('.bccvl-search-results');                        
                            var genusKey = $resultTable.data('data-genusKey');  
                            var index = 0;
                            while (!endOfRecords) {
                                var  surl = bccvl_search.providers.gbif.search.searchSpeciesUrl(genusKey, index, pageSize);
                                $.ajax({
                                    async: false,
                                    dataType: 'jsonp',                       // ..using JSONP instead
                                    url: surl,
                                    success: function(data) {
                                        if (bccvl_search.providers.gbif.search.statusError(data)){
                                            bccvl_search.providers.gbif.autocomplete.noResultsFound(bccvl_search.unexpectedErrorMsg('gbif'));
                                            return
                                        }
                                        // Import all the species datasets
                                        endOfRecords = data.endOfRecords;
                                        var results = bccvl_search.providers.gbif.search.parseSearchData(data, searchString, excluded);
                                        if (!bccvl_search.importSpeciesDatasets(results)) {
                                            bccvl_search.providers.gbif.autocomplete.noResultsFound();
                                        }
                                    },
                                    timeout: 60000,
                                    error: bccvl_search.displayErrorMessage                                    
                                });
                                index += pageSize;
                            } 
                            location.href = $('.bccvllinks-datasets').attr('href');
                        },
                    }
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - -
                },                
                ala: {
                    autocomplete: {
                        autoUrl: function(autocompleteString) {
                            // geoOnly=true  -> only return items that have some geographically mapped records attached
                            // idxType=TAXON -> only items that are actually living things (not collection records, or people, or whatever)
                            return ('ala/auto.json?geoOnly=true&idxType=TAXON&limit=10&q=' + encodeURIComponent(autocompleteString));
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseAutoData: function(rawData) {
                            var list = [];
                            if (rawData.autoCompleteList) {
                                $.each(rawData.autoCompleteList, function(index, item) {
                                    // each item in the autoCompleteList is a taxon.  so it
                                    // only needs to show up once in the suggestion list.
                                    if (typeof(item.rankString) == 'undefined' || item.rankString == 'family') {
                                        return true;
                                    }
                                    var name = ' (' + item.rankString + ')';
                                    name = name + ' <i>' + item.name + '</i>';
                                    if (item.commonName) {
                                        // the commonName string, a comma-separated list of what ALA
                                        // think are common names, is sometimes long.  Often that's
                                        // because of rediculous 'common names' that have sentences
                                        // in them, for example:
                                        // http://bie.ala.org.au/species/Macropus+fuliginosus#tab_names
                                        //
                                        // To de-emphasise the stupider common names, this code
                                        // sorts the common names by length, then re-combines
                                        // them shortest first.  That will pull short, probably
                                        // more useful names to the start, and push the sentence
                                        // length names to the far end.
                                        var sortedNameString = item.commonName.split(/,\s*/).sort( function(a, b) {
                                            return a.length - b.length;
                                        }).join(', ');

                                        if (sortedNameString.length > 100) {
                                            name = name + ' ' + sortedNameString.substring(0,99) + '...';
                                        } else {
                                            name = name + ' ' + sortedNameString
                                        }
                                    }
                                    list.push(name);
                                });
                            }
                            return list;
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        noResultsFound: function(reason) {
                            var $desc = $('.bccvl-labelfade-description');
                            if (reason){
                                $desc.html(reason);
                            }
                            else{
                                $desc.html('No Results Found');
                            }
                            $desc.show();
                            $desc.removeClass('bccvl-read');
                            $desc.addClass('bccvl-unread');
                            setTimeout(function() {
                                $desc.removeClass('bccvl-unread');
                                $desc.addClass('bccvl-read');
                            }, 5000);
                            setTimeout(function(){
                                $desc.hide();
                            }, 8000);
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        cleanAutoItem: function(selectedItem) {
                            // the string will always have <i>sciname</i> at the start, so..
                            return selectedItem.split(/<\/?i>/)[1];
                        }
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                    },
                    search: {
                        searchUrl: function(selectedItem, start, pageSize) {
                            startIndex = start || 0;
                            pageSize = pageSize || 10;
                            var splitItems = selectedItem.split(/<\/?i>/);
                            var rankSupplied = splitItems[0].split(/\((.*)\)/)[1];
                            var searchString = splitItems[1].replace(/\(|\)/g, '');
                            var filter = 'rank:species+OR+rank:subspecies';
                            if (rankSupplied == 'genus') {
                                filter = 'genus:' + searchString + '&fq=(rank:species+OR+rank:genus)&fq=occurrenceCount:[1+TO+*]';
                            }
                            return ('ala/search.json?fq=' + filter + '&q=' + encodeURIComponent(searchString) + '&start=' + startIndex + '&pageSize=' + pageSize + '&sort=rank');
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        searchSpeciesUrl: function(rank, searchString, pageSize) {
                            return ('ala/search.json?fq=' + rank + ':' + searchString + '&fq=rank:species&fq=occurrenceCount:[1+TO+*]&q=&pageSize=' + pageSize);
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        statusError: function(data) {                        
                            return data['searchResults']['status'] == 'ERROR';
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        totalRecords: function(data) {
                            return data['searchResults']['totalRecords'];
                        },                        
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseSearchData: function(rawData, searchString, excluded) {
                            var list = [];
                            if (rawData.searchResults && rawData.searchResults.results) {
                                var included = [];
                                var searchStringWords = searchString.toLowerCase().split(" ");
                                $.each(rawData.searchResults.results, function(index, item) {                                   
                                    // Skip if there is no occurrence count
                                    if (item.occurrenceCount == undefined || item.occurrenceCount <= 0) {
                                        return true;
                                    }

                                    // build the proper data object
                                    result = { title: "", description: "", actions: {}, friendlyname: "", rank: "", genus: "", family: "" };
                                    result.title = item.name;
                                    result.friendlyname = item.name;
                                    result.rank = item.rank;
                                    result.genus = item.genus;
                                    result.family = item.family;
                                    
                                    if (item.commonNameSingle) {
                                        result.title = item.commonNameSingle + ' <i class="taxonomy">' + item.name + '</i>';
                                        result.friendlyname = item.commonNameSingle + ' ' + item.name;
                                    }

                                    // ALA actually performs an 'OR' search on all terms provided.
                                    // So, if we search for say 'Macropus Rufus' we would get back all species containing the
                                    // word 'macropus' and also all species containing the word 'rufus'.
                                    // This is a check to filter out results that do not contain ALL of the words.
                                    var wrongSpecies = false;
                                    $.each(searchStringWords, function(i, searchStringWord) {
                                        if (result.title.toLowerCase().indexOf(searchStringWord) == -1) {
                                            wrongSpecies = true;
                                        }
                                    });
                                    // Skip if wrong species or it is already included
                                    if (wrongSpecies || $.inArray(item.guid, included) != -1) {
                                        // See the jQuery docs, this is like 'continue' inside a $.each (yeh!)
                                        return true;
                                    }

                                    if (item.guid && item.guid.length > 0) {

                                        included.push(item.guid);
                                    } 

                                    if (item.rank) {
                                        result.description += ' (' + item.rank + ')';
                                    }
                                    if (item.occurrenceCount) {
                                        result.description += ' ' + item.occurrenceCount + ' occurrences from ALA';
                                    }
                                    // the thumbnail at ALA is often just an arbitrary crop of the
                                    // small image, so prefer the small image to use as our thumbnail.
                                    if (item.smallImageUrl) {
                                        result.thumbUrl = item.smallImageUrl;
                                    } else if (item.thumbnailUrl) {
                                        result.thumbUrl = item.thumbnailUrl;
                                    }

                                    // now get the actions sorted.
                                    if (item.guid) {
                                        var alaImportArgs = '?import=Import&';
                                        alaImportArgs += 'lsid=' + encodeURIComponent(item.guid) + "&";
                                        alaImportArgs += 'taxon=' + encodeURIComponent(item.name) + "&";
                                        alaImportArgs += 'searchOccurrence_source=' + encodeURIComponent('ala');
                                        if (item.commonNameSingle) {
                                            alaImportArgs += "&common=" + encodeURIComponent(item.commonNameSingle);
                                        }

                                        result.actions.viz = 'http://bie.ala.org.au/species/' + encodeURIComponent(item.guid);
                                        result.actions.alaimport = document.URL + alaImportArgs;
                                    }
                                    list.push(result);
                                });
                            }
                            return list;
                        },
                        // --------------------------------------------------------------
                        getData: function(nextIndex, selectedItem) {
                            // Get species data from ALA. 
                            var pageSize = 10;
                            var searchUrl = bccvl_search.providers.ala.search.searchUrl(selectedItem, nextIndex, pageSize);
                            $('.bccvl-results-spinner').css('display', 'block');
                                
                            return $.ajax({
                                    dataType: 'jsonp',
                                    url: searchUrl,
                                    timeout: 60000
                                });
                        },
                        // --------------------------------------------------------------
                        importGenusDatasets: function(searchString, excluded) {
                            var  surl = bccvl_search.providers.ala.search.searchSpeciesUrl('genus', searchString, 0);

                            $.ajax({
                                dataType: 'jsonp',                       // ..using JSONP instead
                                url: surl,
                                success: function(data) {
                                    if (bccvl_search.providers.ala.search.statusError(data)){
                                        bccvl_search.providers.ala.autocomplete.noResultsFound(bccvl_search.unexpectedErrorMsg('ala'));
                                        return
                                    }

                                    // Set pageSize and search for all the species again
                                    var pageSize = bccvl_search.providers.ala.search.totalRecords(data);
                                    var surl = bccvl_search.providers.ala.search.searchSpeciesUrl('genus', searchString, pageSize);

                                    $.ajax({
                                        dataType: 'jsonp',                       // ..using JSONP instead
                                        url: surl,
                                        success: function(data) {
                                            if (bccvl_search.providers.ala.search.statusError(data)){
                                                bccvl_search.providers.ala.autocomplete.noResultsFound(bccvl_search.unexpectedErrorMsg('ala'));
                                                return
                                            }
                                            // Import all the species datasets
                                            var results = bccvl_search.providers.ala.search.parseSearchData(data, searchString, excluded);
                                            if (!bccvl_search.importSpeciesDatasets(results)) {
                                                bccvl_search.providers.ala.autocomplete.noResultsFound();
                                            }
                                            location.href = $('.bccvllinks-datasets').attr('href');
                                        },
                                        timeout: 60000,
                                        error: bccvl_search.displayErrorMessage                                    
                                    });    
                                },
                                timeout: 60000,
                                error: bccvl_search.displayErrorMessage                            
                            });
                        },
                    }
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - -
                }
            },
            // --------------------------------------------------------------
            // --------------------------------------------------------------
            // --------------------------------------------------------------
            init: function() {
                bccvl_search.enableForms();
            },
            // --------------------------------------------------------------
            enableForms: function() {

                // call enableForm() on each form in the dom
                var $searchForms = $('.bccvl-search-form');
                $.each($searchForms, function(index, form) { bccvl_search.enableForm(form); });
            },
            // --------------------------------------------------------------
            enableForm: function(formElement) {
                // locate all the dom elements we need - - - - - - -
                var $form = $(formElement);

                // find the id of the parent element
                formid = $form.attr('id');
                if (!formid) {
                    console.log('BCCVL-Search: found a .bccvl-search-form but it lacks an id attribute.');
                    return; // bail out of this form if it has no ID
                }

                // we can find the input and source select by concatenating the
                // id of the parent div with "_query" and "_source".
                var $inputField = $form.find('[name="' + formid + '_query"]').first();
                var $sourceField = $form.find('[name="' + formid + '_source"]').first();
                var $resultsField = $('#' + formid + '_results').first();

                // bail if we didn't get the right elements
                if ($inputField.length === 0) {
                    console.warn('BCCVL-Search: found a .bccvl-search-form with id "' + formid + '" but it did not contain a name={id}_query field.');
                    return;
                }
                if ($sourceField.length === 0) {
                    console.warn('BCCVL-Search: found a .bccvl-search-form with id "' + formid + '" but it did not contain a name={id}_source field.');
                    return;
                }

                // switch on all the magic autocomplete behaviour - - - - - - -

                $inputField.attr('autocomplete', 'off'); // switch off browser autocomplete

                // Exclude import list to filter duplicates.
                // Todo: This is a ugly hack. Shall be replaced.
                var excludedList = []

                // Import more records from ALA when it is near the bottom of the page
                var loading = false;    // Indicate if we are still loading from ALA
                $(window).on('scroll', function(e) {
                    if (isNearScreenBottom()) {
                        var $resultTable = $('.bccvl-search-results');                        
                        if (!loading && $resultTable) {
                            var totalRecords = $resultTable.data('data-totalRecords');
                            var nextIndex = $resultTable.data('data-nextIndex');
                            var selectedItem = $resultTable.data('data-selectedItem');
                            var genusKey = $resultTable.data('data-genusKey');

                            // reset the excluded list for a new list
                            if (nextIndex == 0) {
                                excludedList = [];
                            }
                            displayMoreData(nextIndex, totalRecords, selectedItem, genusKey);
                        }
                    }
                });

                $('#searchOccurrence').on('click', 'a.import-dataset-btn', function(e) {
                   e.preventDefault();
                   var $el = $(e.currentTarget);
                   var provider = bccvl_search.providers[$sourceField.val()];

                   // reset the excluded list 
                   excludedList = [];

                   // For genus, import all species datasets 
                   if ($el.attr('data-rank').toLowerCase() == 'genus') {
                        provider.search.importGenusDatasets($inputField.val(), excludedList);
                   }
                   else {
                        location.href = $el.attr('href');
                   }
                });

                // switch on twitter bootstrap autocomplete
                // only do search 
                (function() {
                    var delay = 500;
                    var timeout;
                    var current_ajax;

                    $inputField.typeahead({

                        items: 12,

                        source: function(queryStr, process) {
                            if (timeout) {
                                clearTimeout(timeout);
                            }

                            timeout = setTimeout(function() {
                                if (typeof(current_ajax) != "undefined"){
                                    current_ajax.abort();
                                }
                                    
                                // do nothing if input field is empty and hide spinner
                                if ($.trim($inputField.val()) == ''){
                                    $inputField.removeClass("bccvl-search-spinner");
                                    return;
                                } 

                                $inputField.addClass("bccvl-search-spinner");
                                var provider = bccvl_search.providers[$sourceField.val()];
                                if (!provider) return;
                                if (!provider.autocomplete) return;
                                if (!provider.autocomplete.autoUrl) return;
                                var autocompleteUrl = provider.autocomplete.autoUrl(queryStr);

                                current_ajax = $.ajax({
                                    // xhrFields: { withCredentials: true }, // not using CORS
                                    dataType: 'jsonp',                       // ..using JSONP instead
                                    url: autocompleteUrl,
                                    success: function(data) {
                                        // either the search provider will have a parseAutoData function,
                                        // which extracts the possible matches from the returned data.
                                        if (provider.autocomplete.parseAutoData) {
                                            // if this provider has a parseAutoData function, call it
                                            var parsedDataList = provider.autocomplete.parseAutoData(data);
                                            if (parsedDataList.length == 0) {
                                                provider.autocomplete.noResultsFound();
                                            }
                                            process(parsedDataList);
                                        } else {
                                            // otherwise assume the data is already good
                                            process(data);
                                        }
                                        $inputField.removeClass("bccvl-search-spinner");
                                    },
                                    error: function(xhr, status, msg){
                                        $inputField.removeClass("bccvl-search-spinner");
                                        if (status != 'abort'){
                                            provider.autocomplete.noResultsFound(bccvl_search.unexpectedErrorMsg($sourceField.val()));
                                            process(parsedDataList);
                                        }
                                    }
                                });
                            }, delay);
                            
                        },
                        updater: function(selectedItem) {
                            // returns the value to put into the text box
                            var provider = bccvl_search.providers[$sourceField.val()];
                            if (!provider) return selectedItem;
                            if (!provider.autocomplete) return selectedItem;
                            if (!provider.autocomplete.cleanAutoItem) return selectedItem;

                            // hide old results and show spinner for results
                            $('.bccvl-searchform-results').hide();

                            // do nothing if input field is empty
                            if ($.trim($inputField.val()) == '') return;
                            
                            // Display the result data
                            excludedList = [];
                            displayMoreData(0 /* start index */, -1 /* first time */, selectedItem, -1 /* not genusKey */);
                            return provider.autocomplete.cleanAutoItem(selectedItem);
                        }
                    });
                })();
                // --------------------------------------------------------------           
                function isNearScreenBottom() {
                    return ($(window).height() >= 0.7 * ($(document).height() - $(window).scrollTop()));
                }
                // --------------------------------------------------------------   
                function isScrollBarShown() {
                    return ($(window).height() < $(document).height());
                }
                // -------------------------------------------------------------- 
                function displayMoreData(nextIndex, totalRecords, selectedItem, genusKey) {
                    // Get and display species data from ALA. Negative totalRecord indicates first time, so 
                    // need to create result table.
                    var dataSrc = $sourceField.val();

                    // Get and display species data from ALA. Negative totalRecord indicates first time, so 
                    // need to create result table.
                    var createTable = totalRecords  < 0;
                    if (selectedItem && (totalRecords < 0 || nextIndex < totalRecords)) {
                        // Send a query to ALA to get data; limit to 10 records.
                        // ALA does not send occCount if the number of records is too big i.e. 1370 for Acacia genus.
                        loading = true;
                        var pageSize = 10;
                        var provider = bccvl_search.providers[dataSrc];
                        var searchUrl = provider.search.searchUrl(selectedItem, nextIndex, pageSize);
                        $('.bccvl-results-spinner').css('display', 'block');
                        var results = (genusKey >= 0) ? provider.search.getGenusSpecies(genusKey, nextIndex)
                                                      : provider.search.getData(nextIndex, selectedItem);
                        results.done(function(data) {
                            // Display these records & update the nextIndex
                            var res = displayData(data, provider, createTable, dataSrc, $inputField.val(), $resultsField);
                            if (res != null) {
                                totalRecords = provider.search.totalRecords(data);
                                $('.bccvl-search-results').data('data-totalRecords', totalRecords);
                                $('.bccvl-search-results').data('data-selectedItem', selectedItem);
                                $('.bccvl-search-results').data("data-nextIndex", nextIndex + pageSize);
                                $('.bccvl-search-results').data("data-genusKey", genusKey);
                             
                                // For BGIF, if a genus is selected, need to display its associated species.
                                if (dataSrc == 'gbif' && res.length > 0){
                                    item = res[0];
                                    if (item.rank == 'GENUS'){
                                        displayMoreData(0, pageSize, selectedItem, item.genusKey);
                                        $('.bccvl-search-results').data("data-genusKey", item.genusKey);
                                    }
                                }
                            }                           
                        });
                        results.fail(bccvl_search.displayErrorMessage);
                        results.always(function(xhr, status) {
                                loading = false;
                                if (status == "success" && (!isScrollBarShown() || isNearScreenBottom())) {
                                    displayMoreData(nextIndex + pageSize, totalRecords, selectedItem);
                                }
                        });                            
                    }

                }
                // -------------------------------------------------------------- 
                function displayData(data, provider, newTable, dataSrc, searchString, resultsField) {
                    var results = null;
                    if (provider.search.statusError(data)){
                        provider.autocomplete.noResultsFound(bccvl_search.unexpectedErrorMsg(dataSrc));
                    }
                    else {
                        // if this provider has a parseSearchData function, call it to extract the result
                        // objects from the returned data. Otherwise assume the data is already good.
                        results = (provider.search.parseSearchData) ? provider.search.parseSearchData(data, searchString, excludedList) : data;
                        if (results.length > 0) {
                            bccvl_search.displayResults(results, resultsField, newTable);
                        }
                    }
                    // get rid of spinner
                    $('.bccvl-results-spinner').css('display', 'none');                    
                    return results;
                } 
            },
            // --------------------------------------------------------------
            displayResults: function(results, domElement, newTable) {
                // get a table dom fragment ready to put search results into
                var $elem = $('<table class="table table-hover bccvl-search-results"></table>');

                if (!newTable) {
                    $elem = $('.bccvl-search-results');
                }

                var $tab = $(domElement).closest('.tab-pane');
                if ($tab.length > 0) {
                    // if we're in a tab, find a viz frame on our tab
                    var $vizFrames = $(domElement).closest('.tab-pane').find('iframe.bccvl-viz');
                    if ($vizFrames.length > 0) {
                        var $vizFrame = $vizFrames.first()
                    } else {
                        // We're in a tab with no viz frame
                        var $vizFrame = $('iframe.bccvl-viz').first();
                    }
                } else {
                    // if we're not in a tab, just get the first viz frame on the page
                    var $vizFrame = $('iframe.bccvl-viz').first();
                }

                // loop through the result objects adding them to the table
                $.each(results, function(index, item) {
                    var $info = $('<td class="bccvl-table-label"></td>');
                    var $actions = $('<td class="bccvl-table-controls"></td>');
                    $('#bccvl-search-results').show();
                    if (item.thumbUrl) {
                        $info.append('<div class="bccvl-thumb"><img src="' + item.thumbUrl + '" /></div>');
                    }
                    $info.append('<h1>' + item.title + '</h1>');
                    $info.append('<p>' + item.description + '</p>');

                    $.each(item.actions, function(action, actionParam) {
                        // handle known actions..
                        switch (action) {
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                            case 'alaimport': // import from ala
                                var html = '<a href="' + actionParam + '" class="fine import-dataset-btn btn-mini btn-primary" data-friendlyname="'+ item.friendlyname + '" data-rank="'+ item.rank + '" data-genus="'+ item.genus + '" data-family="'+ item.family +'"><i class="fa fa-cloud-download" data-friendlyname="icon_alaimport_' + item.friendlyname + '"></i> Import to BCCVL</a>';
                                $(html).appendTo($actions);
                                break;
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                            case 'viz': // visualise
                                var html = '<a class="fine view-dataset-external btn btn-mini btn-default" href="' + actionParam + '" target="_blank">';
                                html += '<i class="fa fa-eye icon-link" data-friendlyname="icon_viz_' + item.friendlyname + '"></i> Preview (offsite)</a>';
                                $(html).appendTo($actions);
                                break;
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                            default:
                                $actions.append('<a href="' + actionParam + '">' + action + '</a>');
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                        }
                    });

                    $elem.append( $('<tr></tr>').append($info).append($actions) );
                });

                // finally, add the dom fragment to the page dom.
                if (newTable) {
                    $(domElement).empty().addClass('bccvl-search-active').append($elem);
                }
                // show the results
                $('.bccvl-searchform-results').show();
            },
            // --------------------------------------------------------------
            importSpeciesDatasets: function(results) {
                // Import all the species datasets from the search results
                if (results.length > 0) {
                    $.each(results, function(index, item) {
                        $.each(item.actions, function(action, actionParam) {
                            if (action == 'alaimport') {
                                $.get(actionParam);
                            }
                        });
                    });
                    return true;
                }
                return false;
            },                        
            // --------------------------------------------------------------
            displayErrorMessage: function(xhr, status, msg) {
                if (status === 'timeout') {
                    alert('There was no response to your search query.');
                } else {
                    alert('There was a problem that stopped your query from getting results.');
                }
            },
            // --------------------------------------------------------------
            unexpectedErrorMsg: function(dataSrc) {
                return 'An unexpected error has occurred with ' + dataSrc.toUpperCase() +'. Please try again later.';
            }
            // --------------------------------------------------------------
        }
        return bccvl_search;
    }
);
