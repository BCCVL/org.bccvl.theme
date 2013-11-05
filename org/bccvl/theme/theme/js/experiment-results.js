
//
// main JS for the experiment results page.
//
define(     ['jquery', 'js/bccvl-stretch', 'js/bccvl-visualiser', 'bootstrap'],
    function( $,        stretch          ,  viz ) {
    // ==============================================================
        $(function() {

            stretch.init({ topPad: 60, bottomPad: 10 });
            viz.init();

        });
    // ==============================================================
    }
);