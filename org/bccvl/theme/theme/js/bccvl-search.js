
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
            // --
            // -- this providers config is how search providers are added.
            // -- The ALA provider supplies autocomplete and search examples,
            // -- if you follow those it will probably work as expected.
            // --------------------------------------------------------------
            providers: {
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
                                    if (typeof(item.rankString) == 'undefined') return true;
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
                        searchUrl: function(searchString) {
                            // rank:species  -> only return items that are species (not genus, subspecies etc)
                            return ('ala/search.json?fq=rank:species&q=' + encodeURIComponent(searchString));
                        },
                        // - - - - - - - - - - - - - - - - - - - - - - - - -
                        parseSearchData: function(rawData, searchString) {
                            var list = [];
                            if (rawData.searchResults && rawData.searchResults.results) {
                                var searchStringWords = searchString.toLowerCase().split(" ");
                                $.each(rawData.searchResults.results, function(index, item) {
                                    // build the proper data object
                                    result = { title: "", description: "", actions: {}, friendlyname: "" };
                                    result.title = item.name;
                                    result.friendlyname = item.name;

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
                                    if (wrongSpecies) {
                                        // See the jQuery docs, this is like 'continue' inside a $.each (yeh!)
                                        return true;
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

                                    // actually we only want results that have occurrences..
                                    if (item.occCount && item.occCount > 0) {
                                        list.push(result);
                                    }
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
                                                process(parsedDataList);
                                            } else {
                                                process(parsedDataList);
                                            }
                                        } else {
                                            // otherwise assume the data is already good
                                            process(data);
                                        }
                                        $inputField.removeClass("bccvl-search-spinner");
                                    },
                                    error: function(xhr, status, msg){
                                        $inputField.removeClass("bccvl-search-spinner");
                                        if (status != 'abort'){
                                            provider.autocomplete.noResultsFound('An unexpected error has occurred with ALA. Please try again later.');
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

                            var selectedValue = provider.autocomplete.cleanAutoItem(selectedItem);
                            var searchUrl = provider.search.searchUrl(selectedValue);

                            // hide old results and show spinner for results
                            $('.bccvl-searchform-results').hide();

                            // do nothing if input field is empty
                            if ($.trim($inputField.val()) == '') return;
                            
                            $('.bccvl-results-spinner').css('display', 'block');

                            // get search results
                            $.ajax({
                                // xhrFields: { withCredentials: true }, // not using CORS (ALA said they were working on it)
                                dataType: 'jsonp',                       // ..using JSONP instead
                                url: searchUrl,
                                success: function(data) {
                                    if (data['searchResults']['status'] == 'ERROR'){
                                        provider.autocomplete.noResultsFound('An unexpected error has occurred with ALA. Please try again later.');
                                        $('.bccvl-results-spinner').css('display', 'none');
                                        return
                                    }

                                    // maybe the search provider will have a parseSearchData function,
                                    // which extracts the result objects from the returned data.
                                    if (provider.search.parseSearchData) {
                                        // if this provider has a parseSearchData function, call it
                                        bccvl_search.displayResults(provider.search.parseSearchData(data, $inputField.val()), $resultsField);
                                    } else {
                                        // otherwise assume the data is already good
                                        bccvl_search.displayResults(data, $resultsField);
                                    }
                                },
                                timeout: 60000, // ala is pretty slow...
                                error: function(xhr, status, msg) {
                                    if (status === 'timeout') {
                                        alert('There was no response to your search query.');
                                    } else {
                                        alert('There was a problem that stopped your query from getting results.');
                                    }
                                }
                            });

                            return provider.autocomplete.cleanAutoItem(selectedItem);
                        }
                    });
                })();
            },
            // --------------------------------------------------------------
            displayResults: function(results, domElement) {
                // get a table dom fragment ready to put search results into
                var $elem = $('<table class="table table-hover bccvl-search-results"></table>');

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
                            case 'viz': // visualise
                                var vizParam = actionParam;
                                $('<a class="fine"><i class="icon-eye-open icon-link" data-friendlyname="icon_viz_' + item.friendlyname + '"></i></a>').click(function(e) {
                                    if ($vizFrame.parent().hasClass('hidden')) {
                                        // To switch between preview pane and vizualiser
                                        $vizFrame.parent().removeClass('hidden');
                                        $('div.bccvl-content').addClass('hidden');
                                    }
                                    $vizFrame.attr('src', vizParam);
                                    e.preventDefault();
                                    return false;
                                }).appendTo($actions);
                                break;
                            // - - - - - - - - - - - - - - - - - - - - - - - -
                            case 'alaimport': // import from ala
                                var alaParam = actionParam;
                                $('<a class="fine"><i class="icon-download-alt icon-link" data-friendlyname="icon_alaimport_' + item.friendlyname + '"></i></a>').click(function(e) {
                                    $download_button_div = $(this);
                                    $.xmlrpc({
                                        url: window.bccvl.config.data_mover.baseUrl,
                                        methodName: 'pullOccurrenceFromALA',
                                        params: [alaParam],
                                        success: function(response, status, jqXHR) {
                                            console.log('XMLRPC call to download ALA occurrences succeeded: ', status);
                                            $download_button = $download_button_div.find('.icon-download-alt');
                                            $download_button.hide();
                                            $download_button_div.prepend('<div class="icon-ok"></div>');
                                            $info.append('<p><i>Importing of this dataset has started. This may take a few minutes to complete.</i></p>');
                                            $download_button_div.unbind( "click" );
                                        },
                                        error: function(jqXHR, status, error) {
                                            console.log('XMLRPC call to download ALA occurrences failed with status: "', status, '"; the error was: ', error);
                                            $info.append('<p><i class="bccvl-fail-red">Failed to start import. Please try again.</i></p>');
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
                // get rid of spinner and show the results
                $('.bccvl-results-spinner').css('display', 'none');
                $('.bccvl-searchform-results').show();
            }
            // --------------------------------------------------------------
            // --------------------------------------------------------------
        }
        return bccvl_search;
    }
);
