Mobird.Component = BaseView.extend({

  close: function() {
    if (this.onClose && Mobird.isFunction(this.onClose)) {
      this.onClose.apply(this, arguments);
    }
    this.remove();
    this.trigger('closed',this);
    this.unbind();
  }

});