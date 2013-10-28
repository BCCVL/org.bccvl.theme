
// JS code to make BCCVL "wizard" tabs work.
// Wizard tabs are just Twitter Bootstrap tabs, but with
// prev / next buttons that move between the tabs (the
// idea is that the tabs are different pages in a 'wizard'
// style interface).

define(
    ['jquery'],
    function($) {
        // ==========================================================

        // wizard tabs only need an init function...
        return { init: function() {

            // find all the wizard tab sets..
            wizards = $('.bccvl-wizardtabs');

            $.each(wizards, function(wizardIndex, wizard) {
                $(wizard).parent().find('.tab-content').add(wizard).css('opacity', '0.01');
            });

            $.each(wizards, function(wizardIndex, wizard) {

                // get some jQuery objects together..
                var $wiz = $(wizard);
                var $tabs = $wiz.find('ul.nav.nav-tabs');

                if ($tabs.length == 0) return; // bail if there are no tabs

                // identify the first and last tabs
                var $firstTab = $tabs.find('li:first');
                var $lastTab = $tabs.find('li:last');

                // identify the prev and next buttons
                var $prevButtons = $wiz.find('.bccvl-wizardtabs-prev');
                var $nextButtons = $wiz.find('.bccvl-wizardtabs-next');

                // disable prev and next buttons when appropriate
                $tabs.find('a[data-toggle="tab"]').on('shown', function() {
                    var $currentTab = $tabs.find('li.active');
                    $prevButtons.prop('disabled', $currentTab.is($firstTab));
                    $nextButtons.prop('disabled', $currentTab.is($lastTab));
                })

                // invoke the disable-button code right now..
                $tabs.find('a[data-toggle="tab"]').trigger('shown');

                // hook up the prev buttons
                $prevButtons.click(function(e) {
                    // when a prev button is clicked, move one tab to the left
                    var $currentTab = $tabs.find('li.active');
                    if (! $currentTab.is($firstTab)) {
                        $currentTab.prev().find('a[data-toggle="tab"]').click();
                    }
                    e.preventDefault();
                });

                // hook up the next buttons
                $nextButtons.click(function(e) {
                    // when a next button is clicked, move one tab to the right
                    var $currentTab = $tabs.find('li.active');
                    if (! $currentTab.is($lastTab)) {
                        $currentTab.next().find('a[data-toggle="tab"]').click();
                    }
                    e.preventDefault();
                });

                // the normal Bootstrap strategy of having tabs hidden via CSS stops JS code
                // from finding the positioning-parent of elements, which makes certain types
                // of fanciness difficult, e.g. offsetParent().  We're VERY fancy, so that
                // needs fixing.
                // The fix is to have all tab panes start showing (by having them all marked
                // as "active"), and once they're rendered, click around a bit to re-establish
                // their natural hidden states.

                // define a function to pick the "right" tab
                var pickTab = function($default) {
                    if (!$default) {
                        $default = $('.nav.nav-tabs .active a').first();
                    }
                    var $urlTab = $('a[href=' + location.hash + ']');
                    if ($urlTab.length > 0) {
                        $urlTab.tab('show');
                    } else if ($default.length > 0) {
                        $default.tab('show');
                    }
                }

                // remember the default tab
                var $defaultTab = $('.nav.nav-tabs .active a').first();

                // then click the first and last tabs
                $('.nav.nav-tabs a:last').tab('show');
                $('.nav.nav-tabs a:first').tab('show');

                // call the right-tab-picking function
                pickTab($defaultTab);

                // also pick the right tab when the back button is pressed
                window.addEventListener('popstate', pickTab);

                // put tabs into browser history when clicked (if the browser supports it)
                if (window.history && window.history.pushState) {
                    $tabs.find('a[data-toggle="tab"]').click( function() {
                        window.history.pushState(null, null, $(this).attr('href'));
                    });
                }
            });

            $.each(wizards, function(wizardIndex, wizard) {
                var contents = $(wizard).parent().find('.tab-content').add(wizard);
                contents.css('transition', 'opacity 0.5s');
                contents.css('opacity', '1');
            });


        }}
        // ==========================================================
    }
);

