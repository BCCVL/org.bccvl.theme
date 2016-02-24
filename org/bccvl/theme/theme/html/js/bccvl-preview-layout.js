//
// Layout the bccvl preview pane and datasets list within the window.
//

define(     ['jquery', 'bootstrap2'],
    function( $) {
        var layoutResize = function(){
            // window height
            var windowHeight = window.innerHeight;
            // header height
            var headerHeight = $('.navbar-static-top').outerHeight(true);
            // breadcrumbs
            var breadcrumbHeight = $('.bccvl-breadcrumb .breadcrumb').outerHeight(true);
            // main container padding 
            var tabsHeight = $('.window-layout .nav-tabs').outerHeight(true) + $('.bccvl-tab-description').outerHeight(true) + $('.bccvl-wizardtabs .nav-tabs').outerHeight(true) + $('.bccvl-main>.alert:visible').outerHeight(true);
            // main container padding 
            var mainPadding = parseInt($('.bccvl-main').css('padding-bottom'));
            // footer
            var footerHeight = $('body>footer').outerHeight(true);
            // preview and list height
            var paneHeight = windowHeight - (headerHeight+breadcrumbHeight+tabsHeight+mainPadding+footerHeight);

            $('.window-layout .bccvl-my-datasets [class*="span"]').css('height',''+paneHeight+'px');

        }
        $(document).ready(function(){
            layoutResize();
        });
        $(window).resize(function(){
            layoutResize();
        });
    }
);




















