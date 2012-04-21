$(function(){
    var Spiral = {};

    Spiral.Model = Backbone.Model.extend({});
    Spiral.ModelField = Backbone.Model.extend({});

    Spiral.Serializer = Backbone.Model.extend({
        toggle: function() {
            var is_active = this.get('is_active');
            this.set({
                is_active: !is_active
            });
        }
    });

    Spiral.ModelCollection = Backbone.Collection.extend({
        url: "/models",
        model: Spiral.Model
    });

    Spiral.SerializerCollection = Backbone.Collection.extend({
        url: "/serializers",
        model: Spiral.Serializer
    });

    Spiral.SelectedModelBeacon = _.extend({}, Backbone.Events);
    Spiral.SelectedModel = null;

    Spiral.AllModels = new Spiral.ModelCollection();
    Spiral.AllSerializers = new Spiral.SerializerCollection();
    
    Spiral.MView = Backbone.View.extend({
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.data('backbone-model', this.model);
            this.postRender();
            return this;
        },
        postRender: $.noop
    });

    Spiral.ModelLiView = Spiral.MView.extend({
        tagName: "li",
        className: "model",
        template: _.template($('#model-li-tmpl').html())
    });
    
    Spiral.ModelFieldView = Spiral.MView.extend({
        tagName: "li",
        className: "model-field",
        template: _.template($('#model-field-tmpl').html())
    });

    Spiral.ModelDetails = Spiral.MView.extend({
        tagName: "div",
        className: "model-details",
        template: _.template($('#model-details-tmpl').html()),
        postRender: function() {
            var fields = this.$(".model-fields");
            _.each(this.model.get('fields'), function(field_json) {
                var field = new Spiral.ModelField(field_json);
                var v = new Spiral.ModelFieldView({model:field});
                fields.append(v.render().el);
            });
        }
    });

    Spiral.ModelDetailsContainer = Backbone.View.extend({
        el: $("#model-details-container"),
        initialize: function() {
            Spiral.SelectedModelBeacon.bind('change', this.render, this);
        },
        render: function() {
            var v = new Spiral.ModelDetails({model: Spiral.SelectedModel});
            this.$el.html(v.render().el);
        }
    });
    
    Spiral.SerializerCheckboxView = Spiral.MView.extend({
        tagName: "li",
        className: "serializer",
        template: _.template($('#serializer-checkbox-tmpl').html()),
    });

    Spiral.SerializerList = Backbone.View.extend({
        el: $("#serializer-list-container"),
        initialize: function() {
            this.serializer_list = this.$(".serializer-list");
            Spiral.AllSerializers.bind('all', this.renderSerializers, this);
        },
        events: {
            'click .write-link': 'write',
            'click input.serializer': 'toggleSerializer'
        },
        toggleSerializer: function(e) {
            $(e.target).parents("li").data('backbone-model').toggle();
        },
        write: function() {
            console.log("here");
            var params = {
                models: Spiral.AllModels.toJSON(),
                serializers: Spiral.AllSerializers.toJSON()
            };

            $.post("/write", params, function(data){
                console.log(data);
            }, "json");
        },
        renderSerializers: function() {
            this.serializer_list.empty();

            var self = this;
            Spiral.AllSerializers.each(function(s){
                var v = new Spiral.SerializerCheckboxView({model: s});
                self.serializer_list.append(v.render().el);
            });
        },
    })

    Spiral.ModelList = Backbone.View.extend({
        initialize: function() {
            this.model_list = this.$(".model-list");

            Spiral.AllModels.bind('all', this.renderModels, this);
        },
        el: $("#model-list-container"),
        renderModels: function() {
            var self = this;
            Spiral.AllModels.each(function(model){
                var v = new Spiral.ModelLiView({model: model});
                self.model_list.append(v.render().el);
            });
        },
        events: {
            'click .model': 'showModelDetails'
        },
        showModelDetails: function(e){
            var model = $(e.target).data('backbone-model');
            Spiral.SelectedModel = model;
            Spiral.SelectedModelBeacon.trigger('change');
        }
    });
    
    //init
    new Spiral.ModelList();
    new Spiral.SerializerList();
    new Spiral.ModelDetailsContainer();

    Spiral.AllModels.fetch();
    Spiral.AllSerializers.fetch();

    window.Spiral = Spiral;
});
