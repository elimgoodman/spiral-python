$(function(){
    var Spiral = {};
    
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
            'current_node': null
        },
        moveDown: function() {
            var current_node = this.get('current_node');
            var new_node;

            if(current_node == null) {
                new_node = 0;
            } else {
                new_node = current_node + 1;
            }

            this.set({current_node: new_node});
        },
        moveUp: function() {
            var current_node = this.get('current_node');
            var new_node;

            if(current_node == null) {
                new_node = 0;
            } else {
                new_node = current_node - 1;
            }

            this.set({current_node: new_node});
        }
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

    Spiral.NodeList = Spiral.Collection.extend({});
    Spiral.AllNodes = new Spiral.NodeList();

    Spiral.AllConcepts = new Spiral.ConceptCollection();
    Spiral.Primitives = new Spiral.PrimitiveCollection();

    Spiral.FieldView = Spiral.MView.extend({
        tagName: "li",
        className: "field",
        template: _.template($('#field-tmpl').html()),
        postRender: function() {
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
            var fields = this.$(".fields");
            var type = this.model.get('type');

            _.each(type.get('fields'), function(f){
                var field = new Spiral.Field(f);
                var view = new Spiral.FieldView({model: field});
                fields.append(view.render().el);
            });
        }
    });
    
    Spiral.CursorView = Backbone.View.extend({
        el: $("#cursor"),
        initialize: function() {
            Spiral.TheCursor.bind('change', this.render, this);
        },
        render: function() {
            console.log(Spiral.TheCursor.get('current_node'));
        }
    });
    Spiral.Editor = Backbone.View.extend({
        el: $("#editor"),
        initialize: function() {
            var keymap = {
                'N': this.addNode,
                'J': this.cursorDown,
                'K': this.cursorUp,
            };

            $('body').keyup(function(e){
                var char = String.fromCharCode(e.keyCode);
                var method = keymap[char];
                if(method) {
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
        },
        cursorDown: function() {
            Spiral.TheCursor.moveDown();
        },
        cursorUp: function() {
            Spiral.TheCursor.moveUp();
        }
    });

    Spiral.NodeListView = Backbone.View.extend({
        el: $("#node-list"),
        initialize: function() {
            Spiral.AllNodes.bind('all', this.render, this);
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
    
    Spiral.AllConcepts.bind('reset', function(){
        Spiral.CurrentConcept.set(Spiral.AllConcepts.first());
    });

    Spiral.AllConcepts.fetch();
    Spiral.Primitives.fetch();

    new Spiral.Editor;
    new Spiral.NodeListView;
    new Spiral.CursorView;
    window.Spiral = Spiral;
});
