Filters =

    getCanvas: (w,h) ->
        c = document.createElement('canvas')
        c.width = w
        c.height = h
        return c

    getPixels: (img) ->
        c = @getCanvas(img.width, img.height)
        ctx = c.getContext('2d')
        ctx.drawImage(img,0,0)
        return ctx.getImageData(0, 0, c.width, c.height)

    filterImage: (filter, image, varArgs...) ->
        return filter.apply(null, [@getPixels(image)].concat(varArgs))

    filterImageData: (filter, imageData, varArgs...) ->
        return filter.apply(null, [imageData].concat(varArgs))

    filterCanvas: (filter, canvas, varArgs...) ->
      ctx = canvas.getContext('2d')
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return filter.apply(null, [imageData].concat(varArgs))

window.Filters = Filters
