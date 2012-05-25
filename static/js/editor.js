$(function(){
    var Spiral = window.Spiral || {};

    Spiral.Modes = {};
    Spiral.Modes.NODE = 'node';
    Spiral.Modes.FIELD = 'field';

    Spiral.FieldTypes = {};
    Spiral.FieldTypes.LITERAL = 'literal';
    Spiral.FieldTypes.MULTI = 'multi';
    Spiral.FieldTypes.ALIAS = 'alias';
    Spiral.FieldTypes.PRIMITIVE = 'primitive';
    Spiral.FieldTypes.LIST = 'list';
    
    
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
        },
        toggleSelected: function() {
            if(this.model.get('selected')) {
                this.$el.addClass('selected');
            } else {
                this.$el.removeClass('selected');
            }
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
                return Spiral.FieldTypes.LITERAL;
            } else if(this.get('fields')) {
                return Spiral.FieldTypes.MULTI;
            } else if(this.get('type_alias')) {
                return Spiral.FieldTypes.ALIAS;
            } else if(this.get('list_of')) {
                return Spiral.FieldTypes.LIST;
            } else if(this.isPrimitive()) {
                return Spiral.FieldTypes.PRIMITIVE;
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
        getCurrentFieldIndex: function() {
            var current = this.getCurrentField();
            var i = 0, index;

            _.each(this.getCurrentNodeFields(), function(field){
                if(field.cid == current.cid) {
                    index = i;
                }

                i++;
            });

            return index;
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
        nextNode: function() {
            this.switchCurrentNode(function(index){
                if(index != null && index < (Spiral.AllNodes.length - 1)) {
                    return index + 1;
                } else {
                    return null;
                }
            });
        },
        previousNode: function() {
            this.switchCurrentNode(function(index){
                if(index != null && index > 0) {
                    return index - 1;
                } else {
                    return null;
                }
            });
        },
        getCurrentNodeFields: function() {
            var node = this.getCurrentNode();
            var type = node.get('type');
            return type.get('fields');
        },
        editCurrentNode: function() {
            var fields = this.getCurrentNodeFields();

            this.setCurrentField(fields[0]);
        },
        stopEditingCurrentNode: function() {
            this.setCurrentField(null);
        },
        nextField: function() {
            this.switchCurrentField(function(index, num_fields){
                if(index != null && index < (num_fields - 1)) {
                    return index + 1;
                } else {
                    return null;
                }
            });
        },
        previousField: function() {
            this.switchCurrentField(function(index){
                if(index != null && index > 0) {
                    return index - 1;
                } else {
                    return null;
                }
            });
        },
        switchCurrentField: function(index_xform) {
            var fields = this.getCurrentNodeFields();

            var current_index = this.getCurrentFieldIndex();
            var new_index = index_xform(current_index, fields.length);

            if(new_index != null) {
                this.setCurrentField(fields[new_index]);
            }
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
            this.toggleSelected();

            var type_name = this.model.get('field_type');
            var field_type = this.model.getType();

            var v = new Spiral.TypeInputView({model:field_type});
            this.$(".type-input-container").html(v.render().el);

            if(this.model.get('selected')) {
                v.focus();
            } else {
                v.blur();
            }
        }
    });

    Spiral.TypeInputView = Spiral.MView.extend({
        tagName: "div",
        className: "type-input",
        template: _.template($('#type-input-tmpl').html()),
        events: {
            'keydown .type-input-box': 'recordValue'
        },
        focus: function() {
            this.$el.find('.type-input-box').focus();
        },
        blur: function() {
            this.$el.find('.type-input-box').blur();
        },
        postRender: function() {
            var input_type = this.model.getInputType();
            this.$el.addClass(input_type);

            if(input_type == Spiral.FieldTypes.LITERAL) {
                this.$el.find('.type-input-box').typeahead({
                    source: this.model.get("literals")
                });
            }
        },
        recordValue: function() {
            var val = this.$el.find('.type-input-box').val();
        }
    });

    Spiral.NodeView = Spiral.MView.extend({
        tagName: "div",
        className: "node",
        template: _.template($('#node-tmpl').html()),
        postRender: function() {
            this.toggleSelected();

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

            var node_keys = {};

            node_keys[Spiral.Keys.KEY_N] = this.addNode;
            node_keys[Spiral.Keys.KEY_J] = this.cursorDown;
            node_keys[Spiral.Keys.KEY_K] = this.cursorUp;
            node_keys[Spiral.Keys.KEY_E] = this.editNode;

            keymap[Spiral.Modes.NODE] = node_keys;

            var field_keys = {};

            field_keys[Spiral.Keys.ESCAPE] = this.exitFieldMode;
            field_keys[Spiral.Keys.TAB] = this.nextField;
            field_keys[Spiral.Keys.UP_ARROW] = this.previousField;

            keymap[Spiral.Modes.FIELD] = field_keys;

            $('body').keyup(function(e){
                var mode = Spiral.CurrentMode.get();
                var method = keymap[mode][e.which];
                if(method) {
                    e.preventDefault();
                    method();
                }
            });
        },
        addNode: function() {
            var type = Spiral.CurrentConcept.getRootType();
            var node = new Spiral.Node({
                type: type
            });
            Spiral.AllNodes.push(node);

            Spiral.TheCursor.setCurrentNode(node);
            Spiral.AllNodes.trigger('added');
        },
        cursorDown: function() {
            Spiral.TheCursor.nextNode();
        },
        cursorUp: function() {
            Spiral.TheCursor.previousNode();
        },
        editNode: function() {
            Spiral.CurrentMode.set(Spiral.Modes.FIELD);
            Spiral.TheCursor.editCurrentNode();
        },
        exitFieldMode: function() {
            Spiral.CurrentMode.set(Spiral.Modes.NODE);
            Spiral.TheCursor.stopEditingCurrentNode();
        },
        nextField: function() {
            Spiral.TheCursor.nextField();
        },
        previousField: function() {
            Spiral.TheCursor.previousField();
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
