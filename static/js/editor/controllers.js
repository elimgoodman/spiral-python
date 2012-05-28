(function($){
  var Spiral = Spiral || {};

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

  window.Spiral = Spiral;
})();
