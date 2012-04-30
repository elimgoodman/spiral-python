$(function(){
    var Spiral = {};
    
    Spiral.Collection = Backbone.Collection.extend({
        parse: function(data) {
            return data.resp;
        }
    });

    Spiral.Concept = Backbone.Model.extend({
        getRootType: function() {
            var attrs = this.get('attrs');
            return attrs['root_list_type'];
        }
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
        }
    }, Backbone.Events);

    Spiral.AllConcepts = new Spiral.ConceptCollection();
    
    Spiral.Editor = Backbone.View.extend({
        el: $("#editor"),
        events: {
            'click #add-root-link': 'addRoot'
        },
        addRoot: function() {
            var concept = Spiral.CurrentConcept.get();
            var root_type = concept.getRootType();
            console.log(root_type);
        }
    });

    Spiral.AllConcepts.bind('reset', function(){
        Spiral.CurrentConcept.set(Spiral.AllConcepts.first());
    });
    Spiral.AllConcepts.fetch();

    new Spiral.Editor;
    window.Spiral = Spiral;
});
