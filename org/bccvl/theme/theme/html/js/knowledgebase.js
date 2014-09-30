//
// main JS for the knowledgebase page.
//
define(
    ['jquery', 'bootstrap'],
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

            $('.morefilters').find('h4').each(function(){
                $(this).html($(this).find('.label'));
                $(this).find('.label').prepend('&#43; ');
                $(this).appendTo($(this).parent());
            });

            $('.facets').find('input[type="submit"]').addClass('btn btn-primary');

            // Toggle More filters - hides or shows the extra filters
            $('.morefilters').find('h4').click(function(event){
                $(this).parent().find('.facetmenu').slideToggle();
                if ($(this).parent().find('.facetmenu').css('display') == 'none')
                    $(this).find('.label').html('&#43; More');
                else
                    $(this).find('.label').html('&#45; Less');
            });

        });
        // ==============================================================
    }
);
