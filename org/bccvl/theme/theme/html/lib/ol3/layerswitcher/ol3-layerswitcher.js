
define(     ['jquery', 'openlayers3', 'js/bccvl-visualiser-common'],
            function( $, ol, vizcommon ) {

        /**
         * OpenLayers 3 Layer Switcher Control.
         * See [the examples](./examples) for usage.
         * @constructor
         * @extends {ol.control.Control}
         * @param {Object} opt_options Control options, extends olx.control.ControlOptions adding:
         *                              **`tipLabel`** `String` - the button tooltip.
         */


         // modifications by Sam Wolski, Griffith University eRSAD 
         // Apr 2015
        ol.control.LayerSwitcher = function(opt_options) {

            var options = opt_options || {};

            var tipLabel = options.tipLabel ?
              options.tipLabel : 'Legend';

            this.mapListeners = [];
            this.layerlisteners = [];

            
            this.hiddenClassName = 'ol-unselectable ol-control layer-switcher';
            this.shownClassName = this.hiddenClassName + ' shown';

            var element = document.createElement('div');
            element.className = this.hiddenClassName;

            var button = document.createElement('a');
            button.setAttribute('title', tipLabel);
            button.className = 'ol-button';
            element.appendChild(button);

            this.panel = document.createElement('div');
            this.panel.className = 'panel';
            element.appendChild(this.panel);

            var this_ = this;

            if (options.singleVisibleOverlay) {
                this.singleViewOnly = true;
            }

            if (options.toggleOpen){
                button.onclick = function(e) {
                    if ( this_.element.className.indexOf('shown') > 0){
                        this_.hidePanel();
                    } else {
                        this_.showPanel();
                    }
                };
            } else {
                element.onmouseover = function(e) {
                    this_.showPanel();
                };
                button.onclick = function(e) {
                    this_.showPanel();
                };
                element.onmouseout = function(e) {
                    e = e || window.event;
                    if (!element.contains(e.toElement)) {
                        this_.hidePanel();
                    }
                };
            }

            ol.control.Control.call(this, {
                element: element,
                target: options.target
            });

        };

        ol.inherits(ol.control.LayerSwitcher, ol.control.Control);

        /**
         * Show the layer panel.
         */
        ol.control.LayerSwitcher.prototype.showPanel = function() {
            if (this.element.className != this.shownClassName) {
                this.element.className = this.shownClassName;
                this.renderPanel();
            }
        };

        /**
         * Hide the layer panel.
         */
        ol.control.LayerSwitcher.prototype.hidePanel = function() {
            if (this.element.className != this.hiddenClassName) {
                this.element.className = this.hiddenClassName;
            }
        };

        /**
         * Re-draw the layer panel to represent the current state of the layers.
         */
        ol.control.LayerSwitcher.prototype.renderPanel = function() {

            this.ensureTopVisibleBaseLayerShown_();

            while(this.panel.firstChild) {
                this.panel.removeChild(this.panel.firstChild);
            }

            var ul = document.createElement('ul');
            this.panel.appendChild(ul);
            this.renderLayers_(this.getMap(), ul);

        };

        /**
         * Set the map instance the control is associated with.
         * @param {ol.Map} map The map instance.
         */
        ol.control.LayerSwitcher.prototype.setMap = function(map) {
            // Clean up listeners associated with the previous map
            for (var i = 0, key; i < this.mapListeners.length; i++) {
                this.getMap().unByKey(this.mapListeners[i]);
            }
            this.mapListeners.length = 0;
            // Clean up layer change listeners
            for (var i = 0, key; i < this.layerlisteners.length; i++) {
                binding = this.layerlisteners[i];
                binding[0].unByKey(binding[1]);
            }
            this.layerlisteners.length = 0;
            // Wire up listeners etc. and store reference to new map
            ol.control.Control.prototype.setMap.call(this, map);
            if (map) {
                var this_ = this;
                this.mapListeners.push(map.on('pointerdown', function() {
                    this_.hidePanel();
                }));
                // watch map top level layergroup for changes
                handler = map.getLayerGroup().getLayers().on('propertychange', function(evt) {
                    this_.renderPanel();
                });
                this_.layerlisteners.push([map.getLayerGroup().getLayers(), handler]);
                // recurse through all layers and attach change listeners to
                // all layer groups, re-render layer switcher in case
                // the list of layers on the map has changed
                ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
                    if (l instanceof ol.layer.Group) {
                        handler = l.getLayers().on('propertychange', function(evt) {
                            this_.renderPanel();
                        });
                        this_.layerlisteners.push([l, handler]);
                    }
                });
                // render layer switcher the first time
                this.renderPanel();
            }
        };

        /**
         * Ensure only the top-most base layer is visible if more than one is visible.
         * @private
         */
        ol.control.LayerSwitcher.prototype.ensureTopVisibleBaseLayerShown_ = function() {
            var lastVisibleBaseLyr;
            ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
                if (l.get('type') === 'base' && l.getVisible()) {
                    lastVisibleBaseLyr = l;
                }
            });
            if (lastVisibleBaseLyr) this.setVisible_(lastVisibleBaseLyr, true);
        };

        /**
         * Toggle the visible state of a layer.
         * Takes care of hiding other layers in the same exclusive group if the layer
         * is toggle to visible.
         * @private
         * @param {ol.layer.Base} The layer whos visibility will be toggled.
         */
        ol.control.LayerSwitcher.prototype.setVisible_ = function(lyr, visible, singleOverlay) {

            var map = this.getMap();

            // remove any existing popups or overlays 
                
            map.getOverlays().forEach(function(overlay) {
                overlay.setPosition(undefined);
                map.removeOverlay(overlay); 
            });

            // if its a single layer map, as set in the options, only allow one visible layer
            if (singleOverlay) {
                if( lyr.get('type') !== 'base') {
                    ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
                        if (l.get('type') == 'wms' || l.get('type') == 'wms-occurrence') {
                            l.setVisible(false);
                        }
                    });
                }
            }
            
            lyr.setVisible(visible);

            /* trigger a new legend
            if( lyr.get('type') !== 'base') {
                console.log(lyr);
                //vizcommon.createLegend();
            }*/

            if (visible && lyr.get('type') === 'base') {
                // Hide all other base layers regardless of grouping
                ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
                    if (l != lyr && l.get('type') === 'base') {
                        l.setVisible(false);
                    }
                });
            }
        };

        /**
         * Render all layers that are children of a group.
         * @private
         * @param {ol.layer.Base} lyr Layer to be rendered (should have a title property).
         * @param {Number} idx Position in parent group list.
         */
        ol.control.LayerSwitcher.prototype.renderLayer_ = function(lyr, idx) {

            var this_ = this;

            var li = document.createElement('li');

            var lyrTitle = lyr.get('title');
            var lyrId = lyr.get('title').replace(' ', '-') + '_' + idx;

            var label = document.createElement('label');

            if (lyr.getLayers) {

                li.className = 'group';
                label.innerHTML = lyrTitle;
                li.appendChild(label);
                var ul = document.createElement('ul');
                ul.className = 'layers';
                li.appendChild(ul);

                this.renderLayers_(lyr, ul);

            } else {

                var input = document.createElement('input');
                if (lyr.get('type') === 'base') {
                    input.type = 'radio';
                    input.name = 'base';
                } else if (lyr.get('type') === 'constraint') {
                    input.type = 'checkbox';
                    input.name = 'constraint';
                } else if (this.singleViewOnly && lyr.get('type') != 'constraint'){
                    input.type = 'checkbox';
                    input.name = 'layers';
                } else {
                    input.type = 'checkbox';
                }
                input.id = lyrId;

                input.checked = lyr.get('visible');
                /*if (this.singleViewOnly){
                    //console.log(this_);
                    input.onchange = function(e) {
                        this_.setVisible_(lyr, e.target.checked, true);
                    };
                } else {*/
                    input.onchange = function(e) {
                        this_.setVisible_(lyr, e.target.checked);
                    };
                //}
                
                li.appendChild(input);
                li.dataset.filename = lyrId;

                label.htmlFor = lyrId;
                label.innerHTML = lyrTitle;
                li.appendChild(label);

            }

            return li;

        };

        /**
         * Render all layers that are children of a group.
         * @private
         * @param {ol.layer.Group} lyr Group layer whos children will be rendered.
         * @param {Element} elm DOM element that children will be appended to.
         */
        ol.control.LayerSwitcher.prototype.renderLayers_ = function(lyr, elm) {
            var lyrs = lyr.getLayers().getArray().slice().reverse();

            // sort function
            function sort_li(a, b){
                return ($(b).data('filename')) < ($(a).data('filename')) ? 1 : -1;    
            }

            for (var i = 0, l; i < lyrs.length; i++) {
                l = lyrs[i];

                if (l.get('title')) {
                    elm.appendChild(this.renderLayer_(l, i));

                    // alphabetically sorting the render requests based on the data of nested objects significantly deep,
                    // here we're letting the request pass through as normal, then alphabetising the list items afterwards
                    // (with a handy function to help with numerical values).
                    if( $(elm).hasClass('layers') ) {
                        $(elm).find('li').sort(sort_li).appendTo($(elm));
                    }
                }
            }
        };

        /**
         * **Static** Call the supplied function for each layer in the passed layer group
         * recursing nested groups.
         * @param {ol.layer.Group} lyr The layer group to start iterating from.
         * @param {Function} fn Callback which will be called for each `ol.layer.Base`
         * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
         */
        ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {
            lyr.getLayers().forEach(function(lyr, idx, a) {
                fn(lyr, idx, a);
                if (lyr.getLayers) {
                    ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
                }
            });
        };

        // ============
    }
);
