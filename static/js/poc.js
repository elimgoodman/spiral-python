$(function(){
    var Spiral = {};
    
    Spiral.Collection = Backbone.Collection.extend({
        parse: function(data) {
            return data.resp;
        }
    });

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

    Spiral.ModelCollection = Spiral.Collection.extend({
        url: "/models",
        model: Spiral.Model
    });

    Spiral.SerializerCollection = Spiral.Collection.extend({
        url: "/serializers",
        model: Spiral.Serializer
    });

    Spiral.SelectedModelBeacon = _.extend({}, Backbone.Events);
    Spiral.SelectedSerializerBeacon = _.extend({}, Backbone.Events);
    Spiral.SelectedModel = null;
    Spiral.SelectedSerializer = null;

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

    Spiral.SerializerDetails = Spiral.MView.extend({
        tagName: "div",
        className: "model-details",
        template: _.template($('#serializer-details-tmpl').html()),
        postRender: function() {
            var ta = this.$(".template").get(0);
            var mirror = CodeMirror.fromTextArea(ta, {
                mode: 'python'
            });

            this.area = $(ta);
            this.mirror = mirror;
        },
        events: {
            'click .save-template-link': 'saveTemplate'
        },
        saveTemplate: function(e) {
            e.preventDefault();
            var val = this.mirror.getValue()
            this.model.set({
                template: val
            });
            this.area.html(val);
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

    Spiral.SerializerDetailsContainer = Backbone.View.extend({
        el: $("#serializer-details-container"),
        initialize: function() {
            Spiral.SelectedSerializerBeacon.bind('change', this.render, this);
        },
        render: function() {
            var v = new Spiral.SerializerDetails({model: Spiral.SelectedSerializer});
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
            'click input.serializer': 'toggleSerializer',
            'click .select-serializer-link': 'selectSerializer'
        },
        toggleSerializer: function(e) {
            this.getModelFromEvent(e).toggle();
        },
        selectSerializer: function(e) {
            var serializer = this.getModelFromEvent(e);
            Spiral.SelectedSerializer = serializer;
            Spiral.SelectedSerializerBeacon.trigger('change');
        },
        getModelFromEvent: function(e) {
            return $(e.target).parents("li").data('backbone-model');
        },
        write: function() {
            var params = {
                models: Spiral.AllModels.toJSON(),
                serializers: Spiral.AllSerializers.toJSON()
            };

            $.ajax({
                contentType: 'application/json',
                data: JSON.stringify(params),
                dataType: 'json',
                success: function(data){
                },
                processData: false,
                type: 'POST',
                url: '/write'
            });
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
    new Spiral.SerializerDetailsContainer();

    Spiral.AllModels.fetch();
    Spiral.AllSerializers.fetch();

    window.Spiral = Spiral;
});
