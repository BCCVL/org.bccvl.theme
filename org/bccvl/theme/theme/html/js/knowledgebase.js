
//
// main JS for the knowledgebase page.
//
define(     ['jquery', 'bootstrap'],
    function( $) {
    // ==============================================================
        $(function() {
            
            // Select the appropriate tab to show.
            // Show the search tab if the URL contains '/facet_listing'
        	var $tabPane;
        	if (location.pathname.indexOf('/facet_listing') > -1) {
        		$tabPane = $('a[href="#tab-search"]');
        	} else {
        		$tabPane = $('a[href="#tab-browse"]');
        	}
        	if (!$tabPane.hasClass('active')) {
    			$tabPane.tab('show');
    		}

            // Toggle More filters - hides or shows the extra filters
            $('.morefilters').find('h4').click(function(event){
                if ($(this).parent().find('.facetmenu').css('display') == 'none')
                    $(this).parent().find('.facetmenu').css('display', 'block')
                else
                    $(this).parent().find('.facetmenu').css('display', 'none')
            })

        });
    // ==============================================================
    }
);