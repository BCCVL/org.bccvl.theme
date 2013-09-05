
// JS code to make BCCVL fadeaway instructions work.
// This will find .bccvl-tab-description tags that are
// inside of .tab-pane tags.  Then, when any form fields
// inside the .tab-pane recieves focus, this code will
// add a .bccvl-read class to the .tab-description.
//
// If your CSS is set up right that will trigger a css
// transition of opacity that will fade away the text.
//
// TODO: Make more modular

window.makeBCCVLFadeaway = function() {

    // find all the wizard tab sets..
    fadeables = $('.bccvl-tab-description');

    $.each(fadeables, function(fadeableIndex, fadeable) {

        // get some jQuery objects together..
        var $fade = $(fadeable);
        var $tab = $fade.closest('.tab-pane');

        if ($tab.length == 0) return; // bail if this fadeable isn't in a tab

        // attach an event to every form element in $tab
        // first, find the form elements.
        $tabfields = $($tab.find('input').add( $tab.find('textarea') ).add( $tab.find('select') ));

        // now attach to their focus events
        $tabfields.blur( function() {
            $fade.removeClass('bccvl-read');
        });
        // now attach to their focus events
        $tabfields.focus( function() {
            setTimeout( function() {
                $fade.addClass('bccvl-read');
            }, 100)
        });


    });
}


