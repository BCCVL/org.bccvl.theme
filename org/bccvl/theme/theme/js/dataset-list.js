
//
// main JS for the dataset list page.
//
define(     ['jquery', 'js/bccvl-search', 'js/bccvl-stretch', 'js/bccvl-visualiser', 'bootstrap', 'jquery-tablesorter'],
  function( $      ,  search          ,  stretch          ,  viz ) {
  // ==============================================================
    $(function() {

      viz.init();
      search.init();
      stretch.init({ topPad: 60, bottomPad: 10 });

      $('.bccvl-datasetstable').tablesorter({
        headers: { 
            3: { sorter: false } // should be link column
        }
      });

    });

  // ==============================================================
  }
);
