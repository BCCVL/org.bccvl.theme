
// JS code to initialise search "forms" in the DOM.
//
// Note 1: They're not <form> tag forms.  Just divs (or some other
// tag type) that have a class of bccvl-search-form, and contain
// an <input> and a <select>.
// The <input> is where the user types their search string.  The
// <select> is where the user chooses where the results will come
// from.
//
// A search "form" example:
//
// <div class="bccvl-search-form" id="someIdForTheForm">
//     <input name="someIdForTheForm_query" ...>
//     <select name="someIdForTheForm_source">...</select>
// </div>
//
// The parent tag (a div in the example above) needs an id.  The
// names of the <imput> and <select> tags need to be that id, plus
// _query (for the input) and _source (for the select).

window.bccvl || (window.bccvl = {});

window.bccvl.search = {
    // --------------------------------------------------------------
    providers: {
        ala: {
            autocomplete: {
                url: 'http://bie.ala.org.au/ws/search/auto.json?idxType=TAXON&limit=10&q=',

                provideList: function(rawData, listCallback) {
                    var list = [];
                    if (rawData.autoCompleteList) {
                        $.each(rawData.autoCompleteList, function(index, item) {
                            // each item in the autoCompleteList is a taxon.  so it
                            // only needs to show up once in the suggestion list.
                            var name = ' (' + item.rankString + ')';
                            name = name + ' <i>' + item.name + '</i>';
                            if (item.commonNameMatches && item.commonNameMatches.length > 0) {
                                name = name + ' ' + item.commonNameMatches[0];
                            } else if (item.commonName) {
                                // name = name + ' ' + (item.commonName.split(',',1)[0]).trim()
                                name = name + ' ' + item.commonName
                            }
                            list.push(name);
                        });
                    }
                    listCallback(list);
                },

                cleanItem: function(selectedItem) {
                    // the string will always have <i>sciname</i> at the start, so..
                    return selectedItem.split(/<\/?i>/)[1];
                }
            }
        }
    },
    // --------------------------------------------------------------
    init: function() {
        window.bccvl.search.enableForms();
    },
    // --------------------------------------------------------------
    enableForms: function() {

        // call enableForm() on each form in the dom
        var $searchForms = $('.bccvl-search-form');
        $.each($searchForms, function(index, form) { window.bccvl.search.enableForm(form); });
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
                source: function(queryStr, process) {
                    var provider = window.bccvl.search.providers[$sourceField.val()];
                    if (!provider) return;
                    if (!provider.autocomplete) return;
                    if (!provider.autocomplete.url) return;
                    var sourceUrl = provider.autocomplete.url;

                    $.ajax({
                        // xhrFields: { withCredentials: true }, // not using CORS
                        dataType: 'jsonp',                       // ..using JSONP instead
                        url: sourceUrl + encodeURIComponent(queryStr),
                        success: function(data) {
                            // either the search provider will have a provideList function,
                            // which extracts the possible matches from the returned data.
                            if (provider.autocomplete.provideList) {
                                // if this provider has a provideList function, call it
                                return provider.autocomplete.provideList(data, process);
                            } else {
                                // otherwise the data is already good, so return it
                                return data;
                            }
                        }
                    });
                },
                updater: function(selectedItem) {
                    // returns the value to put into the text box
                    var provider = window.bccvl.search.providers[$sourceField.val()];
                    if (!provider) return selectedItem;
                    if (!provider.autocomplete) return selectedItem;
                    if (!provider.autocomplete.cleanItem) return selectedItem;
                    return provider.autocomplete.cleanItem(selectedItem);
                }
            });

            // acutally search when they press enter - - - - - - - - - - -

            $inputField.keyup( function(event) {
                if (event.keyCode === 13) { // keycode 13 is the enter key
                    console.log('ready to search for ', $inputField.val());
                    event.preventDefault();
                }
            });

    }
    // --------------------------------------------------------------
    // --------------------------------------------------------------
};
