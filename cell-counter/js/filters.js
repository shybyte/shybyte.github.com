(function() {
  var Filters;
  var __slice = Array.prototype.slice;
  Filters = {
    getCanvas: function(w, h) {
      var c;
      c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    },
    getPixels: function(img) {
      var c, ctx;
      c = this.getCanvas(img.width, img.height);
      ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, c.width, c.height);
    },
    filterImage: function() {
      var filter, image, varArgs;
      filter = arguments[0], image = arguments[1], varArgs = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return filter.apply(null, [this.getPixels(image)].concat(varArgs));
    },
    filterImageData: function() {
      var filter, imageData, varArgs;
      filter = arguments[0], imageData = arguments[1], varArgs = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return filter.apply(null, [imageData].concat(varArgs));
    },
    filterCanvas: function() {
      var canvas, ctx, filter, imageData, varArgs;
      filter = arguments[0], canvas = arguments[1], varArgs = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      ctx = canvas.getContext('2d');
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return filter.apply(null, [imageData].concat(varArgs));
    }
  };
  window.Filters = Filters;
}).call(this);
