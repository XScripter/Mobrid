var View = Mobird.View = BaseView.extend({

  _components: null,

  super: function(fn) {

    var caller = View.prototype.super.caller;
    var found;
    for (var child = this; child && Mobird.isFunction(child[fn]); child = child.constructor.__super__) {
      if (!found) {
        found = true;
      } else if (child[fn] != caller) {
        return child[fn].apply(this, [].slice.call(arguments, 1));
      }
    }

  },

  render: function() {
    if (this.template && Mobird.isFunction(this.template)) {
      var data = Mobird.isFunction(this.serializeData) ? this.serializeData() : this;
      var $template = Mobird.$(this.template(data));
      if (this.attachToTemplate && $template.length === 1) {
        // swap out the view on the top level element to avoid duplication
        this.$el.replaceWith($template);

        // delegate events
        this.setElement($template);
      } else {
        this.$el.html($template);
      }
    }

    this.restoreComponents();

    if (this.onRender && Mobird.isFunction(this.onRender)) {
      this.onRender.apply(this, arguments);
    }
    this.trigger('rendered',this);
    return this;
  },

  setComponent: function(component, options) {

    this.removeComponents();
    if (options && options.emptyDOM) {
      this.$el.empty();
    }
    this.addComponent({component: component, selector: this.$el});
    return component;
  },

  getComponent: function() {
    if (this._components && this._components.length > 0) {
      return this._components[0];
    }
  },

  restoreComponents: function() {
    // restore the sub components to the dom
    Mobird.each(this._components, this._showComponent, this);
  },

  addComponent: function(options) {
    if (!options || !options.component) {
      throw new Error('Missing required component option');
    }

    if (!this._components) {
      this._components = [options];
    } else {
      this._components.push(options);
    }

    this.listenTo(options.component,'closed',this._removeComponent);

    return this._showComponent(options);
  },

  getComponentCount: function() {
    return this._components ? this._components.length : 0;
  },

  removeComponents: function() {
    Mobird.each(this._components, function(component) {
      this.stopListening(component.component);
      component.component.close();
    }, this);
    this._components = [];
  },

  _removeComponent: function(component) {
    var componentOption = Mobird.findWhere(this._components, {component: component});
    var index = this._components.indexOf(componentOption);
    if (index > -1) {
      this._components.splice(index,1);
    }
  },

  _showComponent: function(options) {
    var selector;
    if (Mobird.isObject(options.selector)) {
      selector = options.selector;
    } else if (Mobird.isString(options.selector)) {
      selector = this.$(options.selector);
    } else {
      selector = this.$el;
    }

    options.component.render();
    if (options.location === 'prepend') {
      selector.prepend(options.component.el);
    } else if (options.location === 'before') {
      selector.before(options.component.el);
    } else if (options.location === 'after') {
      selector.after(options.component.el);
    } else {
      selector.append(options.component.el);
    }

    if (options.component.onShow && Mobird.isFunction(options.component.onShow)) {
      options.component.onShow.apply(options.component, arguments);
    }
    options.component.trigger('shown',this);

    return options.component;
  },

  close: function() {
    if (this.onClose && Mobird.isFunction(this.onClose)) {
      this.onClose.apply(this, arguments);
    }
    this.removeComponents();
    this.remove();
    this.trigger('closed',this);
    this.unbind();
  }

});