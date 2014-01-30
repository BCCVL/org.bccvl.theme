//
// stretch a DOM object vertically to fill the screen, but keep
// within the vertical constraints of its 'parent'.
//
// E.g.:
// <div class="bccvl-stretch-parent">
//     <div class="leftcolumn">
//         <p>This div will be the one defining the height of the parent.</p>
//         <p>Imagine your leftcolumn and rightcolumn classes position the
//            two divs alongside each other.</p>
//     </div>
//     <div class="rightcolumn bccvl-stretcher">
//         This div will be stretched vertically to match the div alongside it.
//     </div>
// </div>

//
// This means:
//
// - The stretcher stays within the parent
//     If the top or bottom of the parent is on-screen, the top or
//     bottom of the stretcher will be in line with the corresponding
//     part of the parent (if it started in line when this tool was
//     enabled -- actually it maintains the same offset from the
//     parent's top or bottom as it had originally).
//
// - The stretcher stays within the visible viewport
//     If the document has scrolled so that the top of the parent is
//     off the top of the screen, the top of the stretcher will be at
//     the top of the screen (not above it).  You can set an amount
//     of padding amount if you want it offset from the actual screen
//     top.
//     The same applies to the bottom of the parent -- if it's
//     scrolled offscreen, the stretcher's bottom will stay at the
//     bottom of the viewport (plus whatever offset you specify).
//
// Required setup
//
// This will set your stretcher's display property to 'relative'.
// Make sure this doesn't destroy your page layout.  You can test
// this separate from the javascript by adding a style to your
// stretcher tag: style="position: relative".
//
// To use: automatic discovery and invocation
//
// Give your stretcher DOM element the class 'bccvl-stretcher' and a
// css property of 'position: relative'.  You probably also want to
// add 'position: relative' to its parent element.
// Now include this JS file and call bccvl_stretch.init() to
// activate the stretcher behaviour.
//
// The code will locate the positioning parent of the stretcher (the
// nearest parent element that is positioned -- refer to jQuery's
// offsetParent() http://api.jquery.com/offsetParent/ for more info)
// and use that to stretch the stretcher.
//
// To use: explicit invocation
//
// Call bccvl_stretch.enableStretcher(stretcherElement), and
// pass in the element you want to have stretcher bahaviour.
//
// Options
//
// Both forms of invocation can take an options data object. E.g:
//
//     bccvl_stretch.init({ topPad: 60 });
//
// That example will set the top padding to 60px -- the top of the
// stretcher will always be at least 60px away from the top edge
// of the viewport.
//
// Possible options
//
// Here is a folly complete options object:
//
//     options = {
//         topPad:    60,         // top padding of 60px
//         bottomPad: 10,         // bottom padding of 10px
//         parent:    < selector | DOMELement | jQ $elem >
//                                // use this element as the 'parent'
//     }
//
//

define(     ['jquery', 'bootstrap'],
    function( $) {


        var bccvl_stretch = {

            // --------------------------------------------------------------
            defaultOptions: {
                topPad: 5,
                bottomPad: 5
            },
            // --------------------------------------------------------------
            // --------------------------------------------------------------
            init: function(options) {
                bccvl_stretch.enableStretchers(options);
            },
            // --------------------------------------------------------------
            enableStretchers: function(options) {
                // call enableStretcher() on each stretcher in the dom
                var $stretchers = $('.bccvl-stretcher');
                $.each($stretchers, function(index, stretcher) { bccvl_stretch.enableStretcher(stretcher, options); });
            },
            // --------------------------------------------------------------
            enableStretcher: function(stretcherElem, options) {

                // merge together the default and user options
                var opts = {};
                for (var opt in bccvl_stretch.defaultOptions) {
                    opts[opt] = bccvl_stretch.defaultOptions[opt];
                }
                for (var opt in options) {
                    opts[opt] = options[opt];
                }

                // grab the stretcher we're working on, and its parents
                var $stretcher = $(stretcherElem);
                var $parent = $stretcher.closest('.bccvl-stretch-parent');

                opts.startTop = $stretcher.position().top;

                // okay we've got the stretcher and its parent.  Now react to
                // window scrolling and resizing by resetting the stretcher's
                // positioning.
                $(window).scroll(function() { bccvl_stretch._stretch($stretcher, $parent, opts); });
                $(window).resize(function() { bccvl_stretch._stretch($stretcher, $parent, opts); });

                $stretcher.css('position', 'relative');     // so we can set the 'top' directly
                $stretcher.css('box-sizing', 'border-box'); // so the padding won't affect the height
                $stretcher.css('margin-top', '0');          // so the margin won't affect the height
                $stretcher.css('margin-bottom', '0');       // so the margin won't affect the height

                bccvl_stretch._stretch($stretcher, $parent, opts);

                // secret re-stretch events
                // if the stretcher includes an iframe, re-stretch whenever the iframe loads new content:
                $stretcher.find('iframe').load(function() { bccvl_stretch._stretch($stretcher, $parent, opts); });

                // if the stretcher is inside a twitter bootstrap tab, re-stretch whenever the tab is loaded:
                var $tab = $stretcher.closest('.tab-pane');
                if ($tab.length > 0) {
                    var tabId = $tab.attr('id');
                    if (tabId) {
                        $('[href="#' + tabId + '"]').on('shown', function() { bccvl_stretch._stretch($stretcher, $parent, opts); });
                    }
                }
                $stretcher.find('iframe').load(function() { bccvl_stretch._stretch($stretcher, $parent, opts); });

            },
            // --------------------------------------------------------------
            _stretch: function($stretcher, $parent, opts) {
                var $window = $(window);

                // parentTopPos: pixels above the top of the viewport.
                // includes adjustment for top padding.
                // +ve: above the window, -ve: showing on screen

                var parentTopPos = $window.scrollTop() - $parent.offset().top + opts.topPad;

                // parentBottomPos: pixels above the bottom of the viewport.
                // includes adjustment for bottom padding.
                // +ve: below the window, -ve: showing on screen
                var parentBottomPos = $parent.innerHeight() - $window.height() - parentTopPos + opts.topPad + opts.bottomPad;

                // minimum height to deal with pages where the left table is too small
                var minHeight = window.innerHeight - $stretcher.offset().top

                var top = opts.startTop;
                var height = $parent.innerHeight() - opts.startTop;

                if (parentTopPos > 0) {
                    top += parentTopPos;
                    height -= parentTopPos;
                }

                if (parentBottomPos > 0) {
                    height -= parentBottomPos;
                }

                if (height < minHeight ){
                    height = minHeight
                }

                $stretcher.css('height', height + 'px');
                $stretcher.css('top', top + 'px');
            }
            // --------------------------------------------------------------
        };
        return bccvl_stretch;
    }
);




















