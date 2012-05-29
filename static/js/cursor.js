(function(){
    var Spiral = window.Spiral || {};
    
    _.extend(Backbone.Model.prototype, {
        update: function(field, xform) {
            var f = this.get(field);
            var new_f = xform(f);
            var xformed = {};
            xformed[field] = new_f;
            this.set(xformed);
        }
    })

    Spiral.Cursor = Backbone.Model.extend({
        defaults: {
            'current_nodes': {},
            'current_field': null,
            'current_list_type': null,
            'current_list': null,
            'list_stack': []
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

            var current_list = this.getCurrentList();
            this.update('current_nodes', function(current_nodes){
                current_nodes[current_list.cid] = node;
                return current_nodes;
            });
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
            var current_list = this.getCurrentList();
            var nodes = this.get("current_nodes");
            return nodes[current_list.cid];
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
                var new_field = fields[new_index];
                this.setCurrentField(new_field);
            }
        },
        pushCurrentList: function(list, type) {
            this.update('list_stack', function(l){
                l.push({
                  list: list,
                  type: type
                });
                
                return l;
            });

            this.set({
                current_list: list,
                current_list_type: type
            });
        },
        getCurrentList: function() {
            return this.get("current_list");
        }
    });
    Spiral.TheCursor = new Spiral.Cursor;

    window.Spiral = Spiral;
})();
    
