define(
    ['jquery', 'selectize', 'selectize-remove-single'],
    function($) {

        function truncate($elements) {
            $elements.after('<a class="more-info"><i class="fa fa-chevron-down"></i>Details</a>');
            $elements.hide();
            $elements.next('a.more-info').click(function(e){
                e.stopPropagation();
                var _this = $(this);
                if (_this.hasClass('shown')){
                    _this.prev('ul').slideUp(300, function(){
                        _this.removeClass('shown').html('<i class="fa fa-chevron-down"></i>Details');
                    });
                } else {
                    _this.prev('ul').slideDown(300, function(){
                        _this.addClass('shown').html('<i class="fa fa-chevron-up"></i>Hide');;
                    });
                }
            });
        }

        // helper function for selectable behaviour
        function Selectable(elements, multi) {
            

            if (multi) {
                this.multi = true;
            } else {
                this.multi = false;
            }
            
            this.$elements = $(elements);
            this.$elements.click(function(event) {
                // get parent row div
                var $row = $(event.target).closest('.selectable');
                // new state for input element
                if ($row.hasClass('ui-selected') ) {
                    $row.find('input[type="checkbox"]').prop('checked', false);
                    this.unselect($row);
                } else {
                    $row.find('input[type="checkbox"]').prop('checked', true);
                    this.select($row);
                }
            }.bind(this));
        };

        Selectable.prototype.select = function($element) {
            $element.addClass('ui-selected');
            $element.trigger('selected');
            // if not multi select remove all other selections
            if (! this.multi) {
                $.each($element.siblings('.ui-selected'), function(idx, element) {
                    this.unselect($(element));
                }.bind(this));
            }
        };

        Selectable.prototype.unselect = function($element) {
            $element.removeClass('ui-selected');
            $element.trigger('unselected');
        };

        // a class to keep track of selected items
        function Basket() {
            this.uuids = [];
        };

        Basket.prototype.add = function(uuid) {
            var idx = $.inArray(uuid, this.uuids);
            if (idx < 0) {
                this.uuids.push(uuid);
            }
        };

        Basket.prototype.remove = function(uuid) {
            var idx = $.inArray(uuid, this.uuids);
            if (idx >= 0) {
                this.uuids.splice(idx, 1);
            }
        };

        Basket.prototype.contains = function(uuid) {
            var idx = $.inArray(uuid, this.uuids);
            return idx >= 0;
        };

        Basket.prototype.elements = function(uuid) {
            return this.uuids;
        };

        Basket.prototype.clear = function() {
            this.uuids = [];
        };
        
        function ModalBrowseSelect(modalid, options, selected) {

            // FIXME: this becomes a pure id ... no selector?
            this.$modal = $(modalid);
            
            this.settings = $.extend({
                remote: undefined,
                multiple: undefined
            }, options);
    
            // make sure the modal dialog is a top level element on the page
            this.$modal.prependTo($('body'));
            // init modal events
            this.$modal.on('hidden', this._clear.bind(this) );
            // apply button
            this.$modal.find('button.btn-primary').click(function(event) {
                event.preventDefault();
                // trigger custom event
                this.$modal.trigger('modalapply');
            }.bind(this));

            this.$modal.on('show', function(){
                this.$modal.find('.modal-body').css('max-height', (window.innerHeight * 0.75));
            }.bind(this));
            
            // TODO: maybe hook up basket directly with selectable object?
            this.basket = new Basket();
        }

        ModalBrowseSelect.prototype.show = function(selected) {
            // show dialog
            // bootstrap 2 modal does'n have loaded event so we have to do it ourselves
            this.$modal.modal({
                backdrop: 'static',
                show: true
            });
            // init basket in case we have some pre selected elements
            this.basket.clear();
            if (selected) {
                $.each(selected, function(idx, value) {
                    // FIXME: this may circumvent settings.multiple
                    //        for now it's the callers responsibility
                    this.basket.add(value);
                }.bind(this));
            }
            this._init_faceted();
        };


        ModalBrowseSelect.prototype.close = function() {
            this.$modal.modal('hide');
        };

        // hide and clear modal
        ModalBrowseSelect.prototype._clear = function() {
            this.$modal.removeData('modal');

            this.$modal.find('.modal-body').empty();
            Faceted.Cleanup();            
        };

        // load search interface into modal
        ModalBrowseSelect.prototype._init_faceted = function() {
            var self = this;
            this.$modal.find('.modal-body').load(this.settings.remote + '/@@facetednavigation_simple_view', function(event) {
                // apply selectable behaviour
                var selectable = new Selectable($(this).find('#faceted-results'), self.settings.multiple);
                // hookup selectable events with basket
                selectable.$elements.on('selected', function(event) {
                    var uuid = $(event.target).attr('data-uuid');
                    if (! self.settings.multiple) {
                        self.basket.clear();
                    }
                    self.basket.add(uuid);
                });
                selectable.$elements.on('unselected', function(event) {
                    var uuid = $(event.target).attr('data-uuid');
                    self.basket.remove(uuid);
                });
                
                $(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_SUCCESS, function(){

                    truncate(self.$modal.find('#faceted-results').find('ul.details'));
                    // update selection state from basket
                    if(self.settings.multiple == 'multiple'){
                        $.each($("#faceted-results .selectable"), function(idx, element) {
                            var uuid = $(element).attr('data-uuid');
                            if (self.basket.contains(uuid)) {
                                selectable.select($(element));
                                $(element).find('.cell h4').prepend('<input type="checkbox" class="modal-item-checkbox" checked />');
                            } else {
                                $(element).find('.cell h4').prepend('<input type="checkbox" class="modal-item-checkbox"/>');
                            }
                        });
                    } else {
                        $.each($("#faceted-results .selectable"), function(idx, element) {
                            var uuid = $(element).attr('data-uuid');
                            if (self.basket.contains(uuid)) {
                                selectable.select($(element));
                            };
                        });
                    }
                    
                }); 

                $(Faceted.Events).bind(Faceted.Events.INITIALIZE, function() {
                    self.$modal.find('.modal-body .selectize').each(function(){
                        if (this.selectize){
                            this.selectize.destroy();
                        }
                    });

                    self.$modal.find('select[multiple], .selectize').selectize({
                        plugins: ['remove_button', 'remove_single_button'],
                        render: {
                            'option': function(data, escape) {
                                var opt_class="option"
                                var opt_style="";
                                if (data.disabled) {
                                    opt_class += " faceted-select-item-disabled";
                                }
                                var opt_text = '<div class="' + opt_class + '">' + escape(data[this.settings.labelField]);
                                if (typeof data.count !== 'undefined') {
                                    opt_text += ' <span class="badge">' + data.count + '</span>';
                                }
                                return opt_text + '</div>';
                            },
                        },
                        'item': function(data, escape) {
                            var item_text = '<div class="item">' + escape(data[this.settings.labelField]);
                            if (typeof data.count !== 'undefined') {
                                item_text += ' <span class="badge">' + data.count + '</span>';
                            }
                            return item_text + '</div>';
                        },
                        onChange: function(){
                            $('#faceted-results').parent().css('max-height', $('#faceted-form').outerHeight());
                        }
                    });

                    self.$modal.find('.modal-body .selectize').each(function(){
                        if (this.selectize){
                            this.selectize.clear();
                        }
                    });
                });

                // init faceted ui
                Faceted.Load(0, self.settings.remote + '/');

            });
        };

        ModalBrowseSelect.prototype.get_selected = function() {
            return this.basket.elements();
        };


        // A widget to select a list of items
        function SelectList(fieldname) {
            
            this.$widget = $("#form-widgets-" + fieldname);
            
            this.settings = {
                fieldname: fieldname,
                multiple: this.$widget.attr('data-multiple'),
                widgetid: "form-widgets-" + fieldname, // id of widget main top element
                widgetname: "form.widgets." + fieldname, // name of the input field
                widgeturl: location.origin + location.pathname + "/++widget++" + fieldname, // used to reload entire widget
                // modal settings
                modalid: "#" + fieldname + "-modal"
            };
            this.$modaltrigger = $("a#" + fieldname + "-popup");
            
            // init modal
            this.modal = new ModalBrowseSelect(
                this.settings.modalid,
                {
                    remote: this.$modaltrigger.attr('href'),
                    multiple: this.settings.multiple
                }
            );

            // hook up events
            // open modal
            this.$modaltrigger.click(this.modal_open.bind(this));
            // apply changes
            this.modal.$modal.on('modalapply', this.modal_apply.bind(this));

            // allow user to remove selected elements
            $('#' + this.settings.widgetid).on('click', 'a:has(i.icon-remove)',
                function(event) {
                    event.preventDefault();
                    // search for any hidden 'empty-check' fields and update them if an item is removed
	            var field = $(this).parents('.control-group');
	            var numDatasets = field.find('.selecteditem').length-1;
	            
	            if (numDatasets <= 0) {
	                field.find('.empty-check').val('');
	            } else {
	                field.find('.empty-check').val(numDatasets);
	            }
                    $(this).parents('div.selecteditem').remove();
                    // trigger change event on widget update
                    $(event.delegateTarget).trigger('widgetChanged');
                    // TODO: shall we reload the widget?
                }
            );

            // All/None button
            this.$widget.on('click', 'a.select-all', function() {
                $(this).parents('.selecteditem').find('ul li input[type="checkbox"]').prop('checked', 'checked');
            })

            this.$widget.on('click', 'a.select-none', function() {
                // boolean attributes have to be removed completely
                $(this).parents('.selecteditem').find('ul li input[type="checkbox"]').each(function(){
                    $(this).prop('checked', false);
                });
            })
        
        };

        SelectList.prototype.reload_widget = function(params) {
            params.push({name: 'ajax_load', value: 1});
            var $loader = this.$widget.parent().find('span.loader-container img.loader');
            $loader.show(0);

            this.$widget.load(
                this.settings.widgeturl + ' #' + this.settings.widgetid + ' >',
                params,
                function(text, status, xhr) {
                    $loader.hide();
                    // TODO: pass some metadata in with the HTML response instead.
                    var rows = $(text).find('.dataset-rows').data('rows');                    
                    // trigger change event on widget update                        
                    $(this).trigger('widgetChanged', [rows]);
                }
            );
        };

        SelectList.prototype.modal_open = function(event) {
            event.preventDefault();
            // get currently selected uuids
            uuids = [];
            $.each(this.$widget.find('input.item'), function(idx, element) {
                uuids.push($(element).val());
            });
            // show modal
            this.modal.show(uuids);
        };

        SelectList.prototype.modal_apply = function(event) {
            // get selected element
            var selected = this.modal.get_selected();
            // we have all the data we need so get rid of the modal
            this.modal.close();
            // build params
            var params = [];
            $.each(selected, function(idx, uuid) {
                var $existing = $('input[value="' + uuid + '"]').closest('.selecteditem');
                if ($existing.length > 0) {
                    // we have a previously selected item, let's grab all form elements for it
                    var data = $existing.find('input,select').serializeArray();
                    $.merge(params, data);
                    
                } else {
                    // we have got a new item
                    params.push({name: this.settings.widgetname + ':list',
                                 value: uuid});
                }
            }.bind(this));
            this.reload_widget(params);
        };


        // A widget to select a dict of items
        function SelectDict(fieldname) {
            SelectList.call(this, fieldname);
        }
        // SelectDict inherits from SelectList
        SelectDict.prototype = Object.create(SelectList.prototype); // inherit prototype        
        SelectDict.prototype.constructor = SelectDict; // use new constructor
        // override modal_apply 
        SelectDict.prototype.modal_apply = function(event) {
            // get selected element
            var selected = this.modal.get_selected();

            // we have all the data we need so get rid of the modal
            this.modal.close();
            // build params
            var count = parseInt($('[name="' + this.settings.widgetname + '.count"]').val()) || 0;
            var params = [];
            $.each(selected, function(idx, uuid) {
                var $existing = $('input[value="' + uuid + '"]').closest('.selecteditem');
                if ($existing.length > 0) {
                    // we have a previously selected item, let's grab all form elements for it
                    var data = $existing.find('input,select').serializeArray();
                    $.merge(params, data);
                    
                } else {
                    // we have got a new item
                    params.push({name: this.settings.widgetname + '.item.' + count,
                                 value: uuid});
                    count += 1;
                }                
            }.bind(this));
            params.push({name: this.settings.widgetname + '.count',
                         value: count});
            this.reload_widget(params);
        };

        
        return ({
            SelectList: SelectList,
            SelectDict: SelectDict
        });

    }
);

