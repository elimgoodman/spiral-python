$(function(){
    var Spiral = {};

    Spiral.Modes = {};
    Spiral.Modes.NODE = 'node';
    Spiral.Modes.FIELD = 'field';
    
    Spiral.Collection = Backbone.Collection.extend({
        parse: function(data) {
            return data.resp;
        }
    });

    Spiral.MView = Backbone.View.extend({
        render: function() {
            this.$el.html(this.template(this.getTemplateContext()));
            this.$el.data('backbone-model', this.model);
            this.postRender();
            return this;
        },
        postRender: $.noop,
        getTemplateContext: function() {
            return this.model.toJSON();
        },
        initialize: function() {
            this.model.bind('change', this.render, this);
        }
    });

    Spiral.Concept = Backbone.Model.extend({
        getRootType: function() {
            var attrs = this.get('attrs');
            return attrs['root_list_type'];
        },
        initialize: function() {
            var types = _.map(this.get('definitions'), function(d, name){
                return new Spiral.Type(_.extend(d, {
                    name: name
                }));
            });

            this.set({
                types: types
            });
        }
    });

    Spiral.Type = Backbone.Model.extend({
        initialize: function() {
            this.set({
                fields: _.map(this.get('fields'), function(f){
                    return new Spiral.Field(f);
                })
            });
        },
        getInputType: function() {
            if(this.get('literals')) {
                return 'literal';
            } else if(this.get('fields')) {
                return 'multi';
            } else if(this.get('type_alias')) {
                return 'alias';
            } else if(this.isPrimitive()) {
                return 'primitive';
            }
        },

        isPrimitive: function() {
            return this.get('is_primitive');
        }
    });

    Spiral.Node = Backbone.Model.extend({});
    Spiral.Cursor = Backbone.Model.extend({
        defaults: {
            'current_node': null,
            'current_field': null
        },
        setCurrentNode: function (node) {
            var old = this.getCurrentNode();
            if(old) {
                old.set({selected: false});
            }
            node.set({selected: true});
            this.set({current_node: node});
        },
        setCurrentField: function (field) {
            var old = this.getCurrentField();
            if(old) {
                old.set({selected: false});
            }
            if(field) {
                field.set({selected: true});
            }
            this.set({current_field: field});
        },
        getCurrentNode: function() {
            return this.get("current_node");
        },
        getCurrentField: function() {
            return this.get("current_field");
        },
        getCurrentNodeIndex: function() {
            var current = this.getCurrentNode();
            var i = 0, index;

            Spiral.AllNodes.each(function(node){
                if(node.cid == current.cid) {
                    index = i;
                }

                i++;
            });

            return index;
        },
        switchCurrentNode: function(index_xform) {
            var current_index = this.getCurrentNodeIndex();
            var new_index = index_xform(current_index);

            if(new_index != null) {
                var node = Spiral.AllNodes.at(new_index);
                this.setCurrentNode(node);
            }
        },
        moveDown: function() {
            this.switchCurrentNode(function(index){
                if(index != null && index < (Spiral.AllNodes.length - 1)) {
                    return index + 1;
                } else {
                    return null;
                }
            });
        },
        moveUp: function() {
            this.switchCurrentNode(function(index){
                if(index != null && index > 0) {
                    return index - 1;
                } else {
                    return null;
                }
            });
        },
        editCurrentNode: function() {
            var node = this.getCurrentNode();
            var type = node.get('type');
            var fields = type.get('fields');

            this.setCurrentField(fields[0]);
        },
        stopEditingCurrentNode: function() {
            this.setCurrentField(null);
        },
    });
    Spiral.TheCursor = new Spiral.Cursor;

    Spiral.Field = Backbone.Model.extend({
        getType: function() {
            var type_name = this.get("field_type");
            return Spiral.CurrentConcept.getTypeByName(type_name);
        }
    });
    
    Spiral.PrimitiveCollection = Spiral.Collection.extend({
        url: "/primitives",
        model: Spiral.Type
    });

    Spiral.ConceptCollection = Spiral.Collection.extend({
        url: "/concepts",
        model: Spiral.Concept
    });

    Spiral.CurrentConcept = _.extend({
        set: function(c){
            this.c = c;
            this.trigger('change');
        },
        get: function(){
            return this.c;
        },
        getRootType: function() {
            var root_type = this.c.getRootType();

            return this.getTypeByName(root_type);
        },
        getTypeByName: function(name) {
            var types = _.union(this.getCurrentTypes(), Spiral.Primitives.models);
            return _.find(types, function(t) {
                return t.get('name') == name; 
            });
        },
        getCurrentTypes: function() {
            return this.c.get('types');
        }
    }, Backbone.Events);

    Spiral.CurrentMode = _.extend({
        m: Spiral.Modes.NODE,
        set: function(m){
            this.m = m;
            this.trigger('change');
        },
        get: function(){
            return this.m;
        },
    }, Backbone.Events);

    Spiral.NodeList = Spiral.Collection.extend({});
    Spiral.AllNodes = new Spiral.NodeList();

    Spiral.AllConcepts = new Spiral.ConceptCollection();
    Spiral.Primitives = new Spiral.PrimitiveCollection();

    Spiral.FieldView = Spiral.MView.extend({
        tagName: "li",
        className: "field",
        template: _.template($('#field-tmpl').html()),
        postRender: function() {
            if (this.model.get('selected')) {
                this.$el.addClass('selected');
            }

            var type_name = this.model.get('field_type');
            var field_type = this.model.getType();

            var v = new Spiral.TypeInputView({model:field_type});
            this.$(".type-input-container").html(v.render().el);
        }
    });

    Spiral.TypeInputView = Spiral.MView.extend({
        tagName: "div",
        className: "type-input",
        template: _.template($('#type-input-tmpl').html()),
        postRender: function() {
            var input_type = this.model.getInputType();
            this.$el.addClass(input_type);
        }
    });

    Spiral.NodeView = Spiral.MView.extend({
        tagName: "div",
        className: "node",
        template: _.template($('#node-tmpl').html()),
        postRender: function() {
            if(this.model.get('selected')) {
                this.$el.addClass('selected');
            }

            var fields = this.$(".fields");
            var type = this.model.get('type');

            _.each(type.get('fields'), function(f){
                var view = new Spiral.FieldView({model: f});
                fields.append(view.render().el);
            });
        }
    });

    Spiral.Editor = Backbone.View.extend({
        el: $("#editor"),
        initialize: function() {
            var keymap = {};
            keymap[Spiral.Modes.NODE] = {
                'N': this.addNode,
                'J': this.cursorDown,
                'K': this.cursorUp,
                'E': this.editNode
            };
            keymap[Spiral.Modes.FIELD] = {
                'X': this.exitFieldMode
            };

            $('body').keyup(function(e){
                var char = String.fromCharCode(e.keyCode);
                
                var mode = Spiral.CurrentMode.get();
                var method = keymap[mode][char];
                if(method) {
                    method();
                }

                e.preventDefault();
            });
        },
        addNode: function() {
            var type = Spiral.CurrentConcept.getRootType();
            var node = new Spiral.Node({
                type: type
            });
            Spiral.AllNodes.push(node);
            Spiral.AllNodes.trigger('added');

            Spiral.TheCursor.setCurrentNode(node);
        },
        cursorDown: function() {
            Spiral.TheCursor.moveDown();
        },
        cursorUp: function() {
            Spiral.TheCursor.moveUp();
        },
        editNode: function() {
            Spiral.CurrentMode.set(Spiral.Modes.FIELD);
            Spiral.TheCursor.editCurrentNode();
        },
        exitFieldMode: function() {
            Spiral.CurrentMode.set(Spiral.Modes.NODE);
            Spiral.TheCursor.stopEditingCurrentNode();
        }
    });

    Spiral.NodeListView = Backbone.View.extend({
        el: $("#node-list"),
        initialize: function() {
            Spiral.AllNodes.bind('added', this.render, this);
        },
        render: function() {
            var self = this;
            this.$el.empty();

            Spiral.AllNodes.each(function(n) {
                var view = new Spiral.NodeView({model: n});
                self.$el.append(view.render().el);
            });
        }
    });

    Spiral.ModeDisplayView = Backbone.View.extend({
        el: $("#mode-display"),
        initialize: function() {
            Spiral.CurrentMode.bind('change', this.render, this);
            this.render();
        },
        render: function() {
            this.$el.html(Spiral.CurrentMode.get());
        }
    });
    
    Spiral.AllConcepts.bind('reset', function(){
        Spiral.CurrentConcept.set(Spiral.AllConcepts.first());
    });

    Spiral.AllConcepts.fetch();
    Spiral.Primitives.fetch();

    new Spiral.Editor;
    new Spiral.NodeListView;
    new Spiral.ModeDisplayView;
    window.Spiral = Spiral;
});
