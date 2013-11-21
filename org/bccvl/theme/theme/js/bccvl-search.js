
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

define(     ['jquery', 'jquery-xmlrpc', 'bootstrap'],
    function( $      ) {


        var bccvl_search = {
            // --------------------------------------------------------------
            // -- providers -------------------------------------------------
            // --------------------------------------------------------------
            providers: {
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                ala: {
                    autocomplete: {
                        autoUrl: function(autocompleteString) {
                            return ('http://bie.ala.org.au/ws/search/auto.json?idxType=TAXON&limit=10&q=' + encodeURIComponent(autocompleteString));
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseAutoData: function(rawData) {
                            var list = [];
                            if (rawData.autoCompleteList) {
                                $.each(rawData.autoCompleteList, function(index, item) {
                                    // each item in the autoCompleteList is a taxon.  so it
                                    // only needs to show up once in the suggestion list.
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
                        cleanAutoItem: function(selectedItem) {
                            // the string will always have <i>sciname</i> at the start, so..
                            return selectedItem.split(/<\/?i>/)[1];
                        }
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                    },
                    search: {
                        searchUrl: function(searchString) {
                            return ('http://bie.ala.org.au/ws/search.json?fq=idxtype:TAXON&q=' + encodeURIComponent(searchString));
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseSearchData: function(rawData) {
                            var list = [];
                            if (rawData.searchResults && rawData.searchResults.results) {
                                $.each(rawData.searchResults.results, function(index, item) {
                                    // build the proper data object
                                    result = { title: "", description: "", actions: {} };
                                    result.title = item.name;

                                    if (item.commonNameSingle) {
                                        result.title = item.commonNameSingle + ' <i class="taxonomy">' + result.title + '</i>';
                                    }
                                    if (item.rank) {
                                        result.description += ' (' + item.rank + ')';
                                    }
                                    if (item.occCount) {
                                        result.description += ' ' + item.occCount + ' occurrences from ALA';
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
                                        result.actions.viz = 'http://bie.ala.org.au/species/' + encodeURIComponent(item.guid);
                                        result.actions.alaimport = item.guid;
                                    }
                                    list.push(result);
                                });
                            }
                            return list;
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

                // switch on twitter bootstrap autocomplete
                $inputField.typeahead({

                    items: 12,

                    source: function(queryStr, process) {
                        var provider = bccvl_search.providers[$sourceField.val()];
                        if (!provider) return;
                        if (!provider.autocomplete) return;
                        if (!provider.autocomplete.autoUrl) return;
                        var autocompleteUrl = provider.autocomplete.autoUrl(queryStr);

                        $.ajax({
                            // xhrFields: { withCredentials: true }, // not using CORS
                            dataType: 'jsonp',                       // ..using JSONP instead
                            url: autocompleteUrl,
                            success: function(data) {
                                // either the search provider will have a parseAutoData function,
                                // which extracts the possible matches from the returned data.
                                if (provider.autocomplete.parseAutoData) {
                                    // if this provider has a parseAutoData function, call it
                                    process(provider.autocomplete.parseAutoData(data));
                                } else {
                                    // otherwise assume the data is already good
                                    process(data);
                                }
                            }
                        });
                    },
                    updater: function(selectedItem) {
                        // returns the value to put into the text box
                        var provider = bccvl_search.providers[$sourceField.val()];
                        if (!provider) return selectedItem;
                        if (!provider.autocomplete) return selectedItem;
                        if (!provider.autocomplete.cleanAutoItem) return selectedItem;
                        return provider.autocomplete.cleanAutoItem(selectedItem);
                    }
                });

                // acutally search when they enter something - - - - - - - - - - -

                $inputField.change( function(event) {

                    var provider = bccvl_search.providers[$sourceField.val()];
                    if (!provider) return;
                    if (!provider.search) return;
                    if (!provider.search.searchUrl) return;
                    var searchUrl = provider.search.searchUrl($inputField.val());

                    $.ajax({
                        // xhrFields: { withCredentials: true }, // not using CORS (ALA said they were working on it)
                        dataType: 'jsonp',                       // ..using JSONP instead
                        url: searchUrl,
                        success: function(data) {
                            // maybe the search provider will have a parseSearchData function,
                            // which extracts the result objects from the returned data.
                            if (provider.search.parseSearchData) {
                                // if this provider has a parseSearchData function, call it
                                bccvl_search.displayResults(provider.search.parseSearchData(data), $resultsField);
                            } else {
                                // otherwise assume the data is already good
                                bccvl_search.displayResults(data, $resultsField);
                            }
                        },
                        timeout: 1000,
                        error: function(xhr, status, msg) {
                            if (status === 'timeout') {
                                alert('There was no response to your search query.');
                            } else {
                                alert('There was a problem doing your search.');
                            }
                        }
                    });
                });
            },
            // --------------------------------------------------------------
            displayResults: function(results, domElement) {
                // get a table dom fragment ready to put search results into
                var $elem = $('<table class="table table-hover bccvl-search-results"></table>');
                var $vizFrame = $(domElement).closest('.tab-pane').find('iframe.bccvl-viz'); // TODO: don't assume tabs

                // loop through the result objects adding them to the table
                $.each(results, function(index, item) {
                    var $info = $('<td class="bccvl-table-label"></td>');
                    var $actions = $('<td class="bccvl-table-controls"></td>');

                    if (item.thumbUrl) {
                        $info.append('<div class="bccvl-thumb"><img src="' + item.thumbUrl + '" /></div>');
                    }
                    $info.append('<h1>' + item.title + '</h1>');
                    $info.append('<p>' + item.description + '</p>');

                    $.each(item.actions, function(action, actionParam) {
                        // handle known actions..
                        switch (action) {
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                            case 'viz': // visualise
                                var vizParam = actionParam;
                                $('<a class="fine"><i class="icon-eye-open"></i></a>').click(function(e) {
                                    $vizFrame.attr('src', vizParam);
                                    e.preventDefault();
                                    return false;
                                }).appendTo($actions);
                                break;
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                            case 'alaimport': // import from ala
                                var alaParam = actionParam;
                                $('<a class="fine"><i class="icon-download-alt"></i></a>').click(function(e) {
                                    $.xmlrpc({
                                        url: window.bccvl.config.data_mover.baseUrl,
                                        methodName: 'pullOccurrenceFromALA',
                                        params: [alaParam],
                                        success: function(response, status, jqXHR) {
                                            console.log('XMLRPC call to download ALA occurrences succeeded: ', status);
                                        },
                                        error: function(jqXHR, status, error) {
                                            console.log('XMLRPC call to download ALA occurrences failed with status: "', status, '"; the error was: ', error);
                                            alert('There was a problem downloading your ALA data.');
                                        },
                                    });
                                    e.preventDefault();
                                    return false;
                                }).appendTo($actions);
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
                $(domElement).empty().addClass('bccvl-search-active').append($elem);
            }
            // --------------------------------------------------------------
            // --------------------------------------------------------------
        }
        return bccvl_search;
    }
);






















