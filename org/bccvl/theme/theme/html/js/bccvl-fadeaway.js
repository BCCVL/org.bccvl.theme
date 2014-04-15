
// JS code to make BCCVL fadeaway instructions work.
// This will find .bccvl-tab-description tags that are
// inside of .tab-pane tags.  Then, when any form fields
// inside the .tab-pane recieves focus, this code will
// add a .bccvl-read class to the .tab-description.
//
// If your CSS is set up right that will trigger a css
// transition of opacity that will fade away the text.
//
define(     ['jquery'],
    function( $      ) {
        // ==========================================================

        // wizard tabs only need an init function...
        return { init: function() {

            // find all the fadable things..
            var fadeables = $('.bccvl-tab-description');

            $.each(fadeables, function(fadeableIndex, fadeable) {

                // get some jQuery objects together..
                var $fade = $(fadeable);
                var $tab = $fade.closest('.tab-pane');

                if ($tab.length == 0) return; // bail if this fadeable isn't in a tab

                // attach an event to every form element in $tab
                // first, find the form elements.
                var $tabfields = $($tab.find('input, textarea, select'));

                // now attach to their focus events
                $tabfields.focus( function() {
                    setTimeout( function() {
                        $fade.addClass('bccvl-read');
                    }, 100)
                });

                var togglefields = $($tab.find('input[type="radio"], input[type="checkbox"]'));

                // now attach to their change events
                $tabfields.change( function() {
                    setTimeout( function() {
                        $fade.addClass('bccvl-read');
                    }, 100)
                });

                $fade.hover(function() { $fade.removeClass('bccvl-read'); }, function() { $fade.addClass('bccvl-read'); });

            });
        }}
    }
);


