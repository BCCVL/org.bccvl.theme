
//
// main JS for the dataset list page.
//
define(     ['jquery', 'js/bccvl-search', 'js/bccvl-stretch', 'bootstrap'],
    function( $      ,  search          ,  stretch          ) {
    // ==============================================================
        $(function() {

        		// This sets the active tab to reference data sets if the url 
        		// does not end with datasets
        		var my_path = location.pathname;
            if (!my_path.endsWith('datasets') || !my_path.endsWith('datasets/')){
            	$('.bccvl-add-datasets').removeClass('active');
            	$('.bccvl-my-datasets').addClass('active');
            	$('#tab-add').removeClass('active');
            	$('#tab-ref').addClass('active');
            }

            search.init();
            stretch.init({ topPad: 60, bottomPad: 10 });

        });

        String.prototype.endsWith = function(suffix) {
    			return this.indexOf(suffix, this.length - suffix.length) !== -1;
				};
    // ==============================================================
    }
);
