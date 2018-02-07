//
// main JS for the experiment list page.
//
define(
    ['jquery', 'bccvl-modals', 'bootstrap2', 'jquery.tablesorter'],
    function($, modals) {
        // ==============================================================
        $(function() {

            var removemodal = new modals.RemoveModal('remove-modal');
            removemodal.bind('body', 'a.remove-experiment-btn');
            var sharingmodal = new modals.SharingModal('sharing-modal');
            sharingmodal.bind('body', 'a.sharing-btn');

            $('.bccvl-experimenttable').tablesorter({
                headers: {
                    4: {
                        sorter: false
                    } // should be link column
                }
            });
            $('.bccvl-experimenttable .experiment-more-info').hide(0, function() {
                $(this).after('<p><a href="javascript:void(0)" class="more-info show-info">More Info<i class="fa fa-angle-down" style="margin-left:.2em;"></i></a></p>');
            });
            $('.bccvl-experimenttable').on('click', '.more-info.show-info', function() {
                var button = $(this);
                button.parents('td').find('.experiment-more-info').slideDown(300, function() {
                    button.html('Hide<i class="fa fa-angle-up" style="margin-left:.2em;"></i>');
                    button.addClass('hide-info').removeClass('show-info');
                });
            });
            $('.bccvl-experimenttable').on('click', '.more-info.hide-info', function() {
                var button = $(this);
                button.parents('td').find('.experiment-more-info').slideUp(300, function() {
                    button.html('More Info<i class="fa fa-angle-down" style="margin-left:.2em;"></i>');
                    button.addClass('show-info').removeClass('hide-info');
                });
            });
            $(function() {
                $('[data-toggle="tooltip"]').tooltip()
            })
            console.log('page behaviour loaded.');
        });
        // ==============================================================
    }
);
