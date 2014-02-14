
//
// main JS for the dataset list page.
//
define(     ['jquery',  'js/bccvl-stretch', 'js/bccvl-visualiser', 'bootstrap', 'jquery-tablesorter'],
  function(   $      ,   stretch          ,  viz ) {
  // ==============================================================
    $(function() {

      viz.init();
      stretch.init({ topPad: 60, bottomPad: 10 });

      $('.bccvl-datasetstable').tablesorter({
        headers: { 
            2: { sorter: false } // should be link column
        },
            sortList: [[0,1]]
      });

    });

  // ==============================================================
  }
);
