
//
// main JS for the dataset list page.
//
define(     ['jquery', 'js/bccvl-search', 'js/bccvl-stretch', 'bootstrap'],
    function( $      ,  search          ,  stretch          ) {
    // ==============================================================
        $(function() {

            search.init();
            stretch.init({ topPad: 60, bottomPad: 10 });

        });
    // ==============================================================
    }
);
