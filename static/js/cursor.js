(function(){
    var Spiral = window.Spiral || {};

    Spiral.Cursor = Backbone.Model.extend({
        defaults: {
            'current_node': null,
            'current_field': null,
            'current_list_type': null,
            'current_list': null
        },
        addNode: function() {
            var type = this.get('current_list_type');
            var list = this.get('current_list');

            var node = new Spiral.Node({
                type: type
            });
            list.push(node);

            this.setCurrentNode(node);
            list.trigger('added');
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

            this.getCurrentList().each(function(node){
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
                var node = this.getCurrentList().at(new_index);
                this.setCurrentNode(node);
            }
        },
        nextNode: function() {
            var self = this;
            this.switchCurrentNode(function(index){
                if(index != null && index < (self.getCurrentList().length - 1)) {
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
        getCurrentList: function() {
            return this.get("current_list");
        }
    });
    Spiral.TheCursor = new Spiral.Cursor;

    window.Spiral = Spiral;
})();
    
