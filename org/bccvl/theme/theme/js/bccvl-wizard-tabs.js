
// JS code to make BCCVL "wizard" tabs work.
// Wizard tabs are just Twitter Bootstrap tabs, but with
// prev / next buttons that move between the tabs (the
// idea is that the tabs are different pages in a 'wizard'
// style interface).
//
// TODO: This should probably be some kind of jQuery or
// Bootstrap plugin..

window.makeBCCVLWizardButtons = function() {

    // find all the wizard tab sets..
    wizards = $('.bccvl-wizardtabs');

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

    });
}


