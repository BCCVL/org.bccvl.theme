//
// JS to handle for form field description popover
//
define(
    ['jquery'],
    function($) {

        // configure popovers
        $('.bccvl-algorithmtable [data-toggle="popover"]').popover({
                html: true,
                trigger: 'click'
        });
        $('[data-toggle="popover"]').popover({html: true});

        // redefine popver click action
        // show new popover and hide currently active popover if any
        $('[data-toggle="popover"]').click(function (e) {
            e.stopPropagation();
            $('[data-toggle="popover"]').not(this).popover('hide');
        });

        // remove visible popover when clicking anywhere on page
        $(document).click(function (e) {
            if ($(e.target).parent().find('[data-toggle="popover"]').length > 0) {
                $('[data-toggle="popover"]').popover('hide');
            }
        });
    }
);
