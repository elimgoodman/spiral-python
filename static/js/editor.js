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
        isPrimitive: function() {
            return this.get("type") == "Primitive";
        }
    });
    Spiral.Node = Backbone.Model.extend({});
    Spiral.Field = Backbone.Model.extend({});

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
            var types = this.getCurrentTypes();
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

    Spiral.FieldView = Spiral.MView.extend({
        tagName: "li",
        className: "field",
        template: _.template($('#field-tmpl').html()),
        getTemplateContext: function() {
            var type_name = this.model.get('field_type');
            var field_type = Spiral.CurrentConcept.getTypeByName(type_name);
            return _.extend(this.model.toJSON(), {
                field_type: field_type
            });
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
    
    Spiral.Editor = Backbone.View.extend({
        el: $("#editor"),
        initialize: function() {
            var keymap = {
                'N': this.addNode
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

    new Spiral.Editor;
    new Spiral.NodeListView;
    window.Spiral = Spiral;
});
