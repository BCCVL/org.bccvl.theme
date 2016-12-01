//
// main JS for the training page.
//
define(
    ['jquery', 'bootstrap2', 'bccvl-raven'],
    function( $) {
    // ==============================================================
        $(function() {
            // nothing to do so far.
            console.log('training page behaviour loaded.')

            $('.next-button').click(function(){
                var tabNo = $(this).parents('.tab-pane').index();
                var nextTab = $(this).parents('.tab-content').find('.tab-pane').eq(tabNo+1).attr('id');
                $('a[href="#'+nextTab+'"]').tab('show');
            });
            $('.prev-button').click(function(){
                console.log('prev');
                var tabNo = $(this).parents('.tab-pane').index();
                var prevTab = $(this).parents('.tab-content').find('.tab-pane').eq(tabNo-1).attr('id');
                $('a[href="#'+prevTab+'"]').tab('show');
            });
        });
    // ==============================================================
    }
);
