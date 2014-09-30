//
// main JS for the experiment list page.
//
define(
    ['jquery', 'js/bccvl-sharing-modal', 'bootstrap', 'jquery-tablesorter'],
    function($, sharing) {
        // ==============================================================
        $(function() {
            sharing.init();
            $('.bccvl-experimenttable').tablesorter({
                headers: {
                    4: { sorter: false } // should be link column
                }
            });
            console.log('page behaviour loaded.');
        });
        // ==============================================================
    }
);
