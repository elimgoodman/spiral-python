$(function(){
    var Spiral = window.Spiral || {};

    Spiral.Modes = {};
    Spiral.Modes.LIST = 'list';
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
            } else if(this.get('fields').length > 0) {
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

    Spiral.Field = Backbone.Model.extend({
        initialize: function() {
            this.set({
                children: new Spiral.NodeList()
            });
        },
        defaults: {
            value: null
        },
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
        m: Spiral.Modes.LIST,
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

            var field_type = this.model.getType();
            var input_type = field_type.getInputType();

            var v = Spiral.TypeInputView.fromInputType(input_type, this.model);
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
        focus: $.noop,
        blur: $.noop
    });
    
    Spiral.FreeformInputView = Spiral.TypeInputView.extend({
        template: _.template($('#literal-input-tmpl').html()),
        events: {
            'keydown .type-input-box': 'recordValue'
        },
        focus: function() {
            this.$el.find('.type-input-box').focus();
        },
        blur: function() {
            this.$el.find('.type-input-box').blur();
        },
        recordValue: function() {
            var val = this.$el.find('.type-input-box').val();
            this.model.set({value: val}, {silent: true});
        }
    });

    Spiral.ListInputView = Spiral.TypeInputView.extend({
        template: _.template($('#list-input-tmpl').html()),
        focus: function() {
            var type = this.model.getType();
            var list_type = Spiral.CurrentConcept.getTypeByName(type.get('list_of'));

            var list = this.model.get('children');
            Spiral.TheCursor.pushCurrentList(list, list_type);

            Spiral.CurrentMode.set(Spiral.Modes.LIST);
        },
        postRender: function() {
            var children_list = this.$('.children');
            var children = this.model.get('children');
            children.each(function(c){
                children_list.append("<li>foo</li>");
                //var v = new Spiral.NodeView({model: c});
                //console.log(v.render().el);
                //children_list.append(v.render().el);
            });
        },
        blur: function() {
            //Spiral.CurrentMode.set(Spiral.Modes.FIELD);
        }
    });
    Spiral.MultiInputView = Spiral.TypeInputView.extend({});
    Spiral.PrimitiveInputView = Spiral.FreeformInputView.extend({
        postRender: function() {
            this.$el.addClass("primtive");
        }
    });

    Spiral.AliasInputView = Spiral.TypeInputView.extend({
    
    });

    Spiral.LiteralInputView = Spiral.FreeformInputView.extend({
        postRender: function() {
            var field_type = this.model.getType();

            this.$el.find('.type-input-box').typeahead({
                source: field_type.get("literals")
            });
        }
    });

    Spiral.TypeInputView.fromInputType = function(input_type, field) {
        var input_type_to_view = {};

        input_type_to_view[Spiral.FieldTypes.LITERAL] = Spiral.LiteralInputView;
        input_type_to_view[Spiral.FieldTypes.LIST] = Spiral.ListInputView;
        input_type_to_view[Spiral.FieldTypes.MULTI] = Spiral.MultiInputView;
        input_type_to_view[Spiral.FieldTypes.ALIAS] = Spiral.AliasInputView;
        input_type_to_view[Spiral.FieldTypes.PRIMITIVE] = Spiral.PrimitiveInputView;

        return new input_type_to_view[input_type]({model: field});

    };

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

            var list_keys = {};

            list_keys[Spiral.Keys.KEY_N] = this.addNode;
            list_keys[Spiral.Keys.KEY_J] = this.nextNode;
            list_keys[Spiral.Keys.KEY_K] = this.previousNode;
            list_keys[Spiral.Keys.KEY_E] = this.editNode;

            keymap[Spiral.Modes.LIST] = list_keys;

            var field_keys = {};

            field_keys[Spiral.Keys.ESCAPE] = this.exitFieldMode;
            field_keys[Spiral.Keys.TAB] = this.nextField;
            field_keys[Spiral.Keys.UP_ARROW] = this.previousField;

            keymap[Spiral.Modes.FIELD] = field_keys;

            $('body').keydown(function(e){
                var mode = Spiral.CurrentMode.get();
                var method = keymap[mode][e.which];
                if(method) {
                    e.preventDefault();
                    method();
                }
            });
        },
        addNode: function() {
            Spiral.TheCursor.addNode();
        },
        nextNode: function() {
            Spiral.TheCursor.nextNode();
        },
        previousNode: function() {
            Spiral.TheCursor.previousNode();
        },
        editNode: function() {
            Spiral.CurrentMode.set(Spiral.Modes.FIELD);
            Spiral.TheCursor.editCurrentNode();
        },
        exitFieldMode: function() {
            Spiral.CurrentMode.set(Spiral.Modes.LIST);
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

        var list = Spiral.AllNodes;
        var type = Spiral.CurrentConcept.getRootType();

        Spiral.TheCursor.pushCurrentList(list, type);
    });

    Spiral.AllConcepts.fetch();
    Spiral.Primitives.fetch();
    new Spiral.NodeListView;
    new Spiral.Editor;
    new Spiral.ModeDisplayView;

    window.Spiral = Spiral;
});
