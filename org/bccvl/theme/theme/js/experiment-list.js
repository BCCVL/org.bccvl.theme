
//
// main JS for the experiment list page.
//
define(     ['jquery', 'bootstrap', 'jquery-tablesorter'],
    function( $) {
    // ==============================================================
        $(function() {
            $('.bccvl-experimenttable').tablesorter({
                headers: { 
                    4: { sorter: false } // should be link column
                }
            });
            console.log('page behaviour loaded.')
        });
    // ==============================================================
    }
);
