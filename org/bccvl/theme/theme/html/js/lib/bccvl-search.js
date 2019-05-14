
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

define(
    ['jquery', 'aekos-api', 'bccvl-api', 'selectize'],
    function($, aekos, bccvlapi, selectize) {

        // --------------------------------------------------------------
        // -- providers -------------------------------------------------
        // --
        // -- this providers config is how search providers are added.
        // -- The ALA and GBIF providers supply autocomplete and search examples,
        // -- if you follow those it will probably work as expected.
        // --------------------------------------------------------------
        var providers = {};

        providers['obis'] = {
            autocomplete: {
                autoUrl: function(autocompleteString) {
                    return ('https://backend.iobis.org/completetname?q=' + encodeURIComponent(autocompleteString));
                },
                // - - - - - - - - - - - - - - - - - - - - - - - - -
                parseAutoData: function(rawData) {
                    var list = [];
                    if (rawData) {
                        $.each(rawData, function(index, item) {
                            // each item in the autoCompleteList is a taxon.  so it
                            // only needs to show up once in the suggestion list.
                            if (typeof(item.id) == 'undefined') {
                                return true;
                            }
                            //var name = ' (' + item.rank + ')';
                            var name = '<i>' + item.name + '</i>';
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
                    else {
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
                    return ('https://api.iobis.org/taxon?scientificname=' + encodeURIComponent(searchString));
                },
                // - - - - - - - - - - - - - - - - - - - - - - - - -
                searchSpeciesUrl: function(genusKey, start, pageSize) {
                    // To search for all the species belong to a given genus
                    return ('https://backend.iobis.org/children/' + encodeURIComponent(genusKey));
                },
                // - - - - - - - - - - - - - - - - - - - - - - - - -
                statusError: function(data) {
                    return !('results' in data || data.length > 0)
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
                            if (typeof(item.id) == 'undefined' || $.inArray(item.id, included) != -1) {
                                // See the jQuery docs, this is like 'continue' inside a $.each (yeh!)
                                return true;
                            }

                            // Skip if its status is not accepted
                            //if (typeof(item.taxonomicStatus) == 'undefined' || item.taxonomicStatus != 'ACCEPTED') {
                            //    return true;
                            //}

                            // Check if it is alreday included for import in other search
                            if ($.inArray(item.id, excluded) != -1) {
                                return true;
                            }

                            // Skip if rank is undefined. Only interested in species or genus
                            if (typeof(item.rank_name) == 'undefined')
                            {
                                return true;
                            }

                            // build the proper data object
                            result = { title: "", description: "", actions: {}, friendlyname: "", rank: "", genus: "", family: "" };
                            result.title = item.tname;
                            result.friendlyname = item.tname;
                            result.rank = item.rank_name;
                            result.genus = item.genus;
                            result.family = item.family;
                            result.id = item.id;
                            result.genusKey = item.rank_name.toUpperCase() == 'GENUS'? item.id : -1;
                            result.parentId = item.parent_id;

                            //if (item.vernacularName) {
                            //    result.title = item.vernacularName + ' <i class="taxonomy">' + item.scientificName + '</i>';
                            //    result.friendlyname = item.vernacularName + ' ' + item.scientificName;
                            //}

                            if (item.id) {
                                included.push(item.id);
                                excluded.push(item.id);
                            }

                            if (item.rank_name) {
                                result.description += ' (' + item.rank_name + ')';
                            }

                            // now get the actions sorted. For obis, lsid is the obis ID
                            if (item.id) {
                                var obisImportArgs = '?import=Import&';
                                obisImportArgs += 'lsid=' + encodeURIComponent(item.id) + "&";
                                obisImportArgs += 'taxon=' + encodeURIComponent(item.tname) + "&";
                                obisImportArgs += 'searchOccurrence_source=' + encodeURIComponent('obis');

                                result.actions.viz = 'https://www.obis.org/species/' + encodeURIComponent(item.id);
                                result.actions.alaimport = document.URL + obisImportArgs;
                            }
                            list.push(result);
                        });
                    }
                    return list;
                },
                // --------------------------------------------------------------
                parseSearchChildrenData: function(rawData, searchString, excluded, parentid)
                {
                    list = [];
                    $.each(rawData, function(index, item) {
                        // Skip if rank is undefined. Only interested in species or genus
                        if (typeof(item.rank_name) == 'undefined' || (item.rank_name.toUpperCase() != 'SPECIES' && item.rank_name.toUpperCase() != 'GENUS'))
                        {
                            return true;
                        }

                        // skip if there is no record
                        if (item.records <= 0) {
                            return true;
                        }

                        // build the proper data object
                        result = { title: "", description: "", actions: {}, friendlyname: "", rank: "", genus: "", family: "" };
                        result.title = item.tname;
                        result.friendlyname = item.tname;
                        result.rank = item.rank_name;
                        //result.genus = searchString;
                        //result.family = item.family;
                        result.id = item.id;
                        //result.genusKey = parentid;
                        result.parentId = parentid

                        if (item.rank_name) {
                            result.description += ' (' + item.rank_name + ')';
                        }

                        // now get the actions sorted. For GBIF, lsid is the taxonKey/nubKey i.e. speciesKey, genusKey
                        if (item.id) {
                            var obisImportArgs = '?import=Import&';
                            obisImportArgs += 'lsid=' + encodeURIComponent(item.id) + "&";
                            obisImportArgs += 'taxon=' + encodeURIComponent(item.tname) + "&";
                            obisImportArgs += 'searchOccurrence_source=' + encodeURIComponent('obis');

                            result.actions.viz = 'https://www.obis.org/species/' + encodeURIComponent(item.id);
                            result.actions.alaimport = document.URL + obisImportArgs;
                        }
                        list.push(result);
                    });
                    return list;
                },
                // --------------------------------------------------------------
                getData: function(nextIndex, selectedItem, pageSize) {
                    // Get species data from obis
                    var searchUrl = providers.obis.search.searchUrl(selectedItem, nextIndex, pageSize);
                    $('.bccvl-results-spinner').css('display', 'block');

                    return $.ajax({
                        dataType: 'json',
                        url: searchUrl,
                        timeout: 60000
                    });
                },
                // --------------------------------------------------------------
                getGenusSpecies: function(genusKey, nextIndex, pageSize) {
                    var surl = providers.obis.search.searchSpeciesUrl(genusKey, nextIndex, pageSize);
                    $('.bccvl-results-spinner').css('display', 'block');

                    return $.ajax({
                        dataType: 'json',
                        url: surl,
                        timeout: 60000
                    });
                },
            }
            // - - - - - - - - - - - - - - - - - - - - - - - - - - -
        };

        providers['gbif'] = {
            autocomplete: {
                autoUrl: function(autocompleteString) {
                    return ('https://api.gbif.org/v1/species/suggest?q=' + encodeURIComponent(autocompleteString));
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
                    else {
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

                    return ('https://api.gbif.org/v1/species?name=' + encodeURIComponent(searchString) + '&offset=' + startIndex + '&limit=' + pageSize);
                },
                // - - - - - - - - - - - - - - - - - - - - - - - - -
                searchSpeciesUrl: function(genusKey, start, pageSize) {
                    // To search for all the species belong to a given genus
                    startIndex = start || 0;
                    pageSize = pageSize || 10;
                    return ('https://api.gbif.org/v1/species/' + encodeURIComponent(genusKey) + '/children?offset=' + startIndex + '&limit=' + pageSize);
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

                                result.actions.viz = 'https://www.gbif.org/species/' + encodeURIComponent(item.nubKey);
                                result.actions.alaimport = document.URL + gbifImportArgs;
                            }
                            list.push(result);
                        });
                    }
                    return list;
                },
                // --------------------------------------------------------------
                getData: function(nextIndex, selectedItem, pageSize) {
                    // Get species data from GBIF
                    var searchUrl = providers.gbif.search.searchUrl(selectedItem, nextIndex, pageSize);
                    $('.bccvl-results-spinner').css('display', 'block');

                    return $.ajax({
                        dataType: 'json',
                        url: searchUrl,
                        timeout: 60000
                    });
                },
                // --------------------------------------------------------------
                getGenusSpecies: function(genusKey, nextIndex, pageSize) {
                    var surl = providers.gbif.search.searchSpeciesUrl(genusKey, nextIndex, pageSize);
                    $('.bccvl-results-spinner').css('display', 'block');

                    return $.ajax({
                        dataType: 'json',
                        url: surl,
                        timeout: 60000
                    });
                },
            }
            // - - - - - - - - - - - - - - - - - - - - - - - - - - -
        };

        providers['ala'] = {
            autocomplete: {
                autoUrl: function(autocompleteString) {
                    // geoOnly=true  -> only return items that have some geographically mapped records attached
                    // idxType=TAXON -> only items that are actually living things (not collection records, or people, or whatever)
                    return ('https://bie-ws.ala.org.au/ws/search/auto.json?geoOnly=true&idxType=TAXON&limit=10&q=' + encodeURIComponent(autocompleteString));
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
                                // https://bie-ws.ala.org.au/species/Macropus+fuliginosus#tab_names
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
                    else {
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
                        filter = '(rank:species+OR+rank:genus)';
                    }
                    return ('https://bie-ws.ala.org.au/ws/search.json?fq=' + filter + '&q=' + encodeURIComponent(searchString) + '&start=' + startIndex + '&pageSize=' + pageSize + '&sort=rank');
                },
                // - - - - - - - - - - - - - - - - - - - - - - - - -
                searchSpeciesUrl: function(rank, searchString, pageSize) {
                    return ('https://bie-ws.ala.org.au/ws/search.json?fq=' + rank + ':' + searchString + '&fq=rank:species&q=&pageSize=' + pageSize);
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

                                result.actions.viz = 'https://bie-ws.ala.org.au/species/' + encodeURIComponent(item.guid);
                                result.actions.alaimport = document.URL + alaImportArgs;
                            }
                            list.push(result);
                        });
                    }
                    return list;
                },
                // --------------------------------------------------------------
                getData: function(nextIndex, selectedItem, pageSize) {
                    // Get species data from ALA.
                    var searchUrl = providers.ala.search.searchUrl(selectedItem, nextIndex, pageSize);
                    $('.bccvl-results-spinner').css('display', 'block');

                    return $.ajax({
                        dataType: 'json',
                        url: searchUrl,
                        timeout: 60000
                    });
                },
            }
            // - - - - - - - - - - - - - - - - - - - - - - - - - - -
        };

        providers['aekos'] = {
            autocomplete: {
                autoUrl: function(autocompleteString) {
                    // auto complete for species
                    return (aekos.getApiUrl() + 'speciesAutocomplete.json?rows=20&q=' + encodeURIComponent(autocompleteString));
                },
                parseAutoData: function(rawData) {
                    // auto comeplete display / suggestion
                    // and convert to generic part
                    var list = [];
                    if (rawData) {
                        $.each(rawData, function(index, item) {
                            list.push(item.speciesName + ' ('+item.recordsHeld+')');
                        });
                    }
                    return list;
                },
                noResultsFound: function(reason) {
                    // show error
                    var $desc = $('.bccvl-labelfade-description');
                    if (reason){
                        $desc.html(reason);
                    }
                    else {
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
                cleanAutoItem: function(selectedItem) {
                    // the string will always have <i>sciname</i> at the start, so..
                    return selectedItem.split(/<\/?i>/)[1];
                }
            },
            search: {
                searchUrl: function(selectedItem, start, pageSize) {
                    // not used for aekos, because we use the aekos api module in getData
                },
                searchSpeciesUrl: function(rank, searchString, pageSize) {
                    // not used in aekos, because there is no find species for genus feature

                },
                statusError: function(data) {
                    // check if data contains error condition
                    // return true if error
                },
                totalRecords: function(data) {
                    // check data for number of total records in case of paginated result
                },
                parseSearchData: function(rawData, searchString, excluded) {
                    list = []

                    $.each(rawData, function(index, item) {
                        // id: "868412238",
                        // speciesName: "Ctenophorus isolepis",
                        // recordsHeld: 630
                        result = {
                            'title': item.speciesName,
                            'description': item.recordsHeld + ' occurrences from AEKOS',
                            'actions': {
                                //'viz': item.moreInfoUrl,
                                'alaimport': '?import=Import&lsid=' + encodeURIComponent(item.speciesName) + "&taxon=" + encodeURIComponent(item.speciesName) + "&searchOccurrence_source=aekos",
                            },
                            'friendlyName': item.speciesName,
                            'rank': '',
                            'genus': '',
                            'family': '',
                            'occCount': item.recordsHeld,
                            'thumbUrl': '',
                        };

                        list.push(result);
                    });
                    return list;
                },
                getData: function(nextIndex, selectedItem, pageSize) {
                    // Need to remove the number of records at end of the string
                    return aekos.speciesSummary(selectedItem.replace(/ \(\d+\)$/, ""));
                }
            }
        };


        // --------------------------------------------------------------
        // --------------------------------------------------------------
        // --------------------------------------------------------------
        function init() {
            enableForms();
            enableTraitsForms();

        };

        function enableTraitsForms() {
            // call enableForm() on each form in the dom
            var $traitSearchForm = $('.bccvl-search-traits');
            $.each($traitSearchForm, function(index, form) { enableTraitsForm(form); });

        };

        function enableTraitsForm(formElement) {
            // locate all the dom elements we need - - - - - - -
            var $form = $(formElement);
            var $formType = $(formElement).data('form-type');

            // find the id of the parent element
            formid = $form.attr('id');
            if (!formid) {
                console.log('BCCVL-Search: found a .bccvl-search-traits but it lacks an id attribute.');
                return; // bail out of this form if it has no ID
            }

            // we can find the input and source select by concatenating the
            // id of the parent div with "_query" and "_source".

            var $traitsselect = $form.find('[name="searchTraits_traits"]').first(),
                $speciesselect = $form.find('[name="searchTraits_species"]').first(),
                $environmentselect = $form.find('[name="searchTraits_environment"]').first(),
                $importSelection = $form.find('.prepare-selection-btn').first(),
                $traitDataField = $form.find('[name="searchTraits_traitData"]').first(),
                $enviroDataField = $form.find('[name="searchTraits_enviroData"]').first(),
                $submit = $form.find('[name="submit_data"]').first();

            var $traitfield, traitFieldSelect, $speciesField, speciesFieldSelect, $enviroField, enviroFieldSelect;

            // init selectize fields
            if ($speciesselect && $speciesselect.length && $formType != 'traits-by-species') {
                $speciesField = $speciesselect.selectize();
                speciesFieldSelect = $speciesField[0].selectize;
            }
            if ($traitsselect && $traitsselect.length) {
                $traitfield = $traitsselect.selectize();
                traitFieldSelect = $traitfield[0].selectize;
            }
            // init environmental var field
            if ($environmentselect && $environmentselect.length) {
                $enviroField = $environmentselect.selectize();
                enviroFieldSelect = $enviroField[0].selectize;
            }


            // END COMMON

            // TRAITS BY TRAIT FORM

            if ($formType == 'traits-by-trait') {

                // populate traits list
                aekos.getTraitVocab().then(function(data) {

                    // clear current select
                    traitFieldSelect.clearOptions();
                    $.each(data, function(index, trait) {

                        traitFieldSelect.addOption({value: trait.code, text: trait.label })

                    });
                    traitFieldSelect.refreshOptions();

                });

                // watch selection change event on traits
                // when trait selection changes, then update list of species as well
                // .... TODO: keep existing selected species if possible
                $traitsselect.on('change', function(event) {

                    // clear current select
                    speciesFieldSelect.clearOptions();

                    var selectedtraits = traitFieldSelect.items.slice()
                    if (selectedtraits && selectedtraits.length) {
                        aekos.getSpeciesByTrait(selectedtraits).then(
                            function(data) {
                                $.each(data, function(index, species) {
                                    speciesFieldSelect.addOption({value: species.name, text: species.name });

                                });
                                speciesFieldSelect.refreshOptions();
                            }
                        );
                    }
                });

                // hook up species selection chance
                // when species selection changes fetch list of available env vars
                // this works via sites where species occurred.
                // TODO: keep selected env vars if possible
                $speciesselect.on('change', function(event) {


                    // clear current select
                    enviroFieldSelect.clearOptions();

                    var selectedspecies = speciesFieldSelect.items.slice();
                    if (selectedspecies && selectedspecies.length) {
                        aekos.getEnvironmentBySpecies(selectedspecies).then(
                            function(data) {
                                $.each(data, function(index, envvar) {
                                    enviroFieldSelect.addOption({value: envvar.code, text: envvar.label });
                                });
                                enviroFieldSelect.refreshOptions();
                            }
                        );
                    }
                });

            } else if ($formType == 'traits-by-species') {

                $speciesField = $speciesselect.selectize({
                    valueField: 'speciesName',
                    labelField: 'speciesName',
                    searchField: 'speciesName',
                    options: [],
                    create: false,
                    maxItems: 4,
                    load: function(query, callback){
                        if (!query.length) return callback();
                        aekos.speciesAutocomplete(query).then(function(results){
                            callback(results);
                        });

                    },
                    render: {
                        item: function(item, escape) {
                            return '<div>'+item.speciesName+' ('+item.recordsHeld+')</div>';
                        },
                        option: function(item, escape) {
                            return '<div>'+item.speciesName+' ('+item.recordsHeld+')</div>';
                        }
                    }

                });

                speciesFieldSelect = $speciesField[0].selectize;

                $speciesselect.on('change', function(event) {

                    // clear current select
                    traitFieldSelect.clearOptions();

                    // speciesFieldSelect = $(this)[0].selectize
                    var selectedspecies = speciesFieldSelect.items.slice();
                    if (selectedspecies && selectedspecies.length) {
                        aekos.getTraitsBySpecies(selectedspecies).then(
                            function(data) {
                                $.each(data, function(index, trait) {
                                    traitFieldSelect.addOption({value: trait.code, text: trait.label });
                                });
                                traitFieldSelect.refreshOptions();
                                speciesFieldSelect.blur();
                                traitFieldSelect.focus();
                            }
                        );
                         aekos.getEnvironmentBySpecies(selectedspecies).then(
                            function(data) {
                                $.each(data, function(index, envvar) {
                                    enviroFieldSelect.addOption({value: envvar.code, text: envvar.label });
                                });
                                enviroFieldSelect.refreshOptions(false);
                            }
                        );
                    }
                });

                $traitsselect.on('change', function(event) {
                    enviroFieldSelect.focus();
                });
            }

            // TODO: should this be on page?
            $submit.click(function() {
                var species = speciesFieldSelect.items.slice(),
                    traits = traitFieldSelect.items.slice(),
                    enviro = enviroFieldSelect.items.slice();

                // make sure species is an array
                if (! species instanceof Array) {
                    species = species.split(',');
                }

                $submit.find('i').removeClass().addClass('fa fa-spinner fa-pulse fa-fw');
                bccvlapi.dm.import_trait_data(
                    {
                        'source': 'aekos',
                        'species': species,
                        'traits': traits,
                        'environ': enviro
                    },
                    true
                ).then(
                    function(data, textStatus, jqXHR) {
                        console.log(jqXHR);
                        $submit.find('i').removeClass();
                        // jqXHR.status ... http number
                        window.location = jqXHR.getResponseHeader('Location');
                    },
                    function(jqXHR, textStatus, errorThrown) {
                        // jqXHR.responseText
                        // $.parseJSON(jqXHR.responseText)
                        alert('Failure when submitting dataset import');
                        $submit.find('i').removeClass();
                    }
                );

            });

            $importSelection.click(function(){
                var species = speciesFieldSelect.items.slice(),
                    traits  = traitFieldSelect.items.slice(),
                    enviro  = enviroFieldSelect.items.slice();

                $importSelection.find('i.fa').removeClass().addClass('fa fa-spinner fa-pulse fa-fw');

                $.when(
                    // TODO: a single quick check whether there are any results is good enough
                    //       no need to download the whole dataset which could be large
                    //       and takes a long time
                    aekos.getTraitDataBySpecies(species, traits),
                    aekos.getTraitDataByEnviro(species, enviro)
                ).done(function(traitData, enviroData) {
                    var traitResponse = traitData[0].response,
                        enviroResponse = enviroData[0].response;

                    if (traitData[0].responseHeader.numFound > 0 && enviroData[0].responseHeader.numFound > 0 ) {

                        $traitDataField.val(JSON.stringify(traitResponse));
                        $enviroDataField.val(JSON.stringify(enviroResponse));

                        $importSelection.find('i.fa').removeClass().addClass('fa fa-check-circle');
                        $submit.removeAttr('disabled');

                    } else if (traitData[0].responseHeader.numFound == 0 && enviroData[0].responseHeader.numFound > 0 ) {

                        alert('No trait data was found matching your selection. However, you may still import the matching environmental variable data, or change your selection.');

                        $enviroDataField.val(JSON.stringify(enviroResponse));

                        $importSelection.find('i.fa').removeClass().addClass('fa fa-check-circle');
                        $submit.removeAttr('disabled');

                    } else if (traitData[0].responseHeader.numFound > 0 && enviroData[0].responseHeader.numFound == 0 ) {

                        alert('No environmental variable data was found matching your selection. However, you may still import the matching trait data, or change your selection.');

                        $traitDataField.val(JSON.stringify(traitResponse));

                        $importSelection.find('i.fa').removeClass().addClass('fa fa-check-circle');
                        $submit.removeAttr('disabled');

                    } else {
                        $importSelection.find('i.fa').removeClass().addClass('fa fa-folder-open');
                        alert('There was a problem receiving the selected data (or there were no results), please try again later or modify your selection.');
                    }
                });
            });

        };

        // --------------------------------------------------------------
        function enableForms() {
            // call enableForm() on each form in the dom
            var $searchForms = $('.bccvl-search-form');
            $.each($searchForms, function(index, form) { enableForm(form); });
        };
        // --------------------------------------------------------------
        function enableForm(formElement) {
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

            $form.on('click', 'a.import-dataset-btn', function(e) {
                e.preventDefault();
                var $el = $(e.currentTarget);
                var provider = providers[$sourceField.val()];

                // reset the excluded list
                excludedList = [];

                // For genus, import as multispecies dataset as well as 
                // all individual species datasets
                location.href = $el.attr('href');
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
                            var provider = providers[$sourceField.val()];
                            if (!provider) return;
                            if (!provider.autocomplete) return;
                            if (!provider.autocomplete.autoUrl) return;
                            var autocompleteUrl = provider.autocomplete.autoUrl(queryStr);

                            current_ajax = $.ajax({
                                // xhrFields: { withCredentials: true }, // not using CORS
                                //dataType: 'jsonp',                       // ..using JSONP instead
                                dataType: 'json',
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
                                        provider.autocomplete.noResultsFound(unexpectedErrorMsg($sourceField.val()));
                                    }
                                }
                            });
                        }, delay);

                    },
                    updater: function(selectedItem) {
                        // returns the value to put into the text box
                        var provider = providers[$sourceField.val()];
                        if (!provider) return selectedItem;
                        if (!provider.autocomplete) return selectedItem;
                        if (!provider.autocomplete.cleanAutoItem) return selectedItem;

                        // hide old results and show spinner for results
                        $('.bccvl-searchform-results').hide();

                        // do nothing if input field is empty
                        if ($.trim($inputField.val()) == '') return;

                        // Display the result data
                        excludedList = [];
                        // start search
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
                // totalRecords < 0 means we start a new search so clear the result area
                if (totalRecords < 0) {
                    $resultsField.empty().addClass('bccvl-search-active');
                }
                // Get and display species data from ALA
                var dataSrc = $sourceField.val();

                if (selectedItem && (totalRecords < 0 || nextIndex < totalRecords)) {
                    // Send a query to ALA to get data; limit to 10 records.
                    // ALA does not send occCount if the number of records is too big i.e. 1370 for Acacia genus.
                    loading = true;
                    var pageSize = 20;
                    var provider = providers[dataSrc];
                    $('.bccvl-results-spinner').css('display', 'block');
                    var results = (genusKey >= 0) ? provider.search.getGenusSpecies(genusKey, nextIndex, pageSize)
                        : provider.search.getData(nextIndex, selectedItem, pageSize);
                    results.done(function(data) {
                        // Display these records & update the nextIndex
                        var res = displayData(data, provider, dataSrc, $inputField.val(), $resultsField);
                        if (res != null) {
                            totalRecords = provider.search.totalRecords(data);
                            $('.bccvl-search-results').data('data-totalRecords', totalRecords);
                            $('.bccvl-search-results').data('data-selectedItem', selectedItem);
                            $('.bccvl-search-results').data("data-nextIndex", nextIndex + pageSize);
                            $('.bccvl-search-results').data("data-genusKey", genusKey);

                            // For GBIF, if a genus is selected, need to display its associated species.
                            if ((dataSrc == 'gbif' || dataSrc == 'obis') && res.length > 0){
                                item = res[0];
                                if (item.rank.toUpperCase() == 'GENUS'){
                                    displayMoreData(0, pageSize, selectedItem, item.genusKey);
                                    $('.bccvl-search-results').data("data-genusKey", item.genusKey);
                                }
                            }
                        }
                    });
                    results.fail(displayErrorMessage);
                    results.always(function(xhr, status) {
                        loading = false;
                        if (status == "success" && (!isScrollBarShown() || isNearScreenBottom())) {
                            displayMoreData(nextIndex + pageSize, totalRecords, selectedItem);
                        }
                    });
                }

            }
            // --------------------------------------------------------------
            function displayData(data, provider, dataSrc, searchString, resultsField) {
                var results = null;
                if (provider.search.statusError(data)){
                    provider.autocomplete.noResultsFound(unexpectedErrorMsg(dataSrc));
                }
                else {
                    // if this provider has a parseSearchData function, call it to extract the result
                    // objects from the returned data. Otherwise assume the data is already good.
                    results = (provider.search.parseSearchData) ? provider.search.parseSearchData(data, searchString, excludedList) : data;
                    if (results.length > 0) {
                        displayResults(results, resultsField);
                    }
                }
                // get rid of spinner
                $('.bccvl-results-spinner').css('display', 'none');
                return results;
            }
        };
        // --------------------------------------------------------------
        displayResults = function(results, domElement) {
            // get a table dom fragment ready to put search results into
            var $elem  = $('.bccvl-search-results');
            if ($elem.length == 0) {
                // create new table and add to page
                $elem = $('<table class="table table-hover bccvl-search-results"></table>');
                $(domElement).empty().addClass('bccvl-search-active').append($elem);
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

            // show the results
            $('.bccvl-searchform-results').show();
        };
        // --------------------------------------------------------------
        importSpeciesDatasets = function(results) {
            // Import all the species datasets from the search results
            var deferreds = [];
            $.each(results, function(index, item) {
                $.each(item.actions, function(action, actionParam) {
                    if (action == 'alaimport') {
                        function import_dataset() {
                            var deferred = $.Deferred();
                            deferreds.push(deferred);
                            function request_dataset(retries) {
                                retries = retries + 1;
                                $.get(actionParam).then(
                                    function(result) {
                                        deferred.resolve(result);
                                    },
                                    function(result) {
                                        if (retries >= 3) {
                                            deferred.resolve(result);
                                        }
                                        else {
                                            request_dataset(retries);
                                        }
                                    }
                                )
                            };
                            request_dataset(0);
                        };
                        import_dataset();
                    }
                });
            });
            return deferreds;
        };
        // --------------------------------------------------------------
        displayErrorMessage = function(xhr, status, msg) {
            if (status === 'timeout') {
                alert('There was no response to your search query.');
            } else {
                // ignore UNSENT requests
                if (xhr.readyState != 0) {
                    alert('There was a problem that stopped your query from getting results.');
                }
            }
        };
        // --------------------------------------------------------------
        unexpectedErrorMsg = function(dataSrc) {
            return 'An unexpected error has occurred with ' + dataSrc.toUpperCase() +'. Please try again later.';
        }
        // --------------------------------------------------------------
        return {
            'providers': providers,
            'init': init,
            'enableForms': enableForms,
            'enableForm': enableForm,
            'displayResults': displayResults,
            'importSpeciesDatasets': importSpeciesDatasets,
            'displayErrorMessage': displayErrorMessage,
            'unexpectedErrorMsg': unexpectedErrorMsg
        };
    }
);
