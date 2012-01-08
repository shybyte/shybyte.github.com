markingsIdCounter = 0
draggedMarking = null

class Marking
  constructor:(@pos, @type) ->
    self = this
    @id = markingsIdCounter++
    @el = jq('<div/>').addClass('marking markingType' + @type).attr(
      id:@id
      draggable:false
    ).bind('dragend',
      ->
        log('dragend')
    ).bind('dragstart', ->
        self.el.css('opacity', '0.4')
        draggedMarking = self
        log("dragstart")
    )
    @move(pos)

  move:(pos) ->
    @pos = pos

  updateScreenPos: (canvas,$canvas) ->
    screenPos = {left:@pos.x/canvas.width*$canvas.width(), top:@pos.y/canvas.height*$canvas.height()}
    @el.css(screenPos)



initCellCounter = () ->
  $threshold = jq('#threshold')
  $fadeThresholdImage = jq('#fadeThresholdImage')
  $markingsSize = jq('#markingsSize')
  currentImg = null
  $canvas = jq('#mainCanvas')
  canvas = $canvas.get(0)
  filteredCanvas = jq('#filteredCanvas').get(0)
  ctx = canvas.getContext('2d')
  ctxFiltered = filteredCanvas.getContext('2d')
  markings = []
  $markings = jq('#markings')
  currentFilename = ""

  init = ->
    initReadFile()
    initDragAndDrop()
    initManualCounter()
    initSliders()
    loadImage('images/nora1.jpg')
    initOnResize()
    jq('#removeAllMarkings').click(removeAllMarkings)
    jq('#filterButton').click(filterImage2)

  initOnResize = ->
    jq(window).resize( (e)->
      #updateMarkingsScreenPos
      for marking in markings
        marking.updateScreenPos(canvas,$canvas)
    )

  loadMarkings = ()->
    removeAllMarkings()
    markingsDataString = (localStorage['markings_data_'+currentFilename]) || "[]"
    markingsData = JSON.parse(markingsDataString)
    for markingData in markingsData
      addMarking(markingData.pos, markingData.type)

  saveMarkings = () ->
    markingsData = ({pos:marking.pos,type:marking.type} for marking in markings)
    localStorage['markings_data_'+currentFilename] = JSON.stringify(markingsData)


  initReadFile = ->
    $openFile = jq('#openFile')
    $openFile.change(->
        files = $openFile.get(0).files
        loadLocalImage(files[0])
    )


  initDragAndDrop = ->
    $markings.bind('dragover',
      ->
        #canvas.className = 'ondragover'
        return false
    ).bind('dragleave',
      ->
        canvas.className = ''
        return false
    ).bind('drop', (e) ->
        canvas.className = ''
        e.preventDefault()
        if e.originalEvent.dataTransfer.files.length > 0
          loadLocalImage(e.originalEvent.dataTransfer.files[0])
        else if draggedMarking
          log("nada")
      #draggedMarking.move(eventPosInCanvas(e.originalEvent))
      #draggedMarking.el.css('opacity', '1.0')
      #draggedMarking = null
    )

  initSliders = ->
    bindSliderChange = ($slider, onChange)->
      $slider.hide().rangeinput().change(onChange)
    bindSliderChangeAndSlide = ($slider, onChange)->
      bindSliderChange($slider, onChange).bind('onSlide', onChange)
    $markingsSize = bindSliderChangeAndSlide($markingsSize, onChangeMarkingsSize)
    $threshold = bindSliderChange($threshold, filterImage)
    $fadeThresholdImage = bindSliderChangeAndSlide($fadeThresholdImage, changeFading)


  onChangeMarkingsSize = ->
    cssRule = getCSSRule('.marking')
    newMarkingsSize = $markingsSize.val()
    cssRule.style.width = newMarkingsSize + 'px'
    cssRule.style.height = newMarkingsSize + 'px'
    cssRule.style.marginLeft = -newMarkingsSize / 2 + 'px'
    cssRule.style.marginTop = -newMarkingsSize / 2 + 'px'

  initManualCounter = ->
    $markings.click((e) ->
        pos = eventPosInImage(e)
        log(pos)
        if e.ctrlKey and markings.length > 0
          removeMarking(pos)
        else
          addMarkingWithSelectedType(pos)
    )
    $markings.bind('contextmenu', (e)->
        e.preventDefault()
        removeMarking(eventPosInImage(e))
    )

  eventPosInImage = (e)->
    eventPosInCanvas = (e)->
      canvasOffset = $canvas.offset()
      return {x:e.pageX - canvasOffset.left, y:e.pageY - canvasOffset.top}
    p = eventPosInCanvas(e)
    return {
      x:Math.round(p.x/$canvas.width()*canvas.width)
      y:Math.round(p.y/$canvas.height()*canvas.height)
    }



  changeFading = ->
    v = $fadeThresholdImage.val()
    v = v / 128
    if v < 1
      v1 = 1
      v2 = v
    else
      v1 = 2 - v
      v2 = 1
    jq('#mainCanvas').css('opacity', v1)
    jq('#filteredCanvas').css('opacity', v2)

  addMarkingWithSelectedType = (pos) ->
    addMarking(pos, jq('input:radio[name=markingColor]:checked').val())
    saveMarkings()

  addMarking = (pos, type) ->
    marking = new Marking(pos, type)
    markings.push(marking)
    $markings.append(marking.el)
    marking.updateScreenPos(canvas,$canvas)
    showCellCount()

  removeMarking = (pos) ->
    marking = findNearestMarking(pos.x, pos.y)
    if marking
      markings = _.without(markings, marking)
      marking.el.remove()
      showCellCount()
      saveMarkings()

  onRemoveAllMarkings = ->
    removeAllMarkings()
    saveMarkings()

  removeAllMarkings = ->
    for marking in markings
      marking.el.remove()
    markings = []
    showCellCount()



  showCellCount = ->
    groupedMarkings = _.groupBy(markings, 'type')
    countByCellType = (type2) ->
      (groupedMarkings[type2]?.length) ? 0
    jq('#cellCount0').text(countByCellType(0))
    jq('#cellCount1').text(countByCellType(1))

  findNearestMarking = (x, y) ->
    _.min(markings, (marking) ->
        dx = marking.pos.x - x
        dy = marking.pos.y - y
        dx * dx + dy * dy
    )

  loadLocalImage = (file) ->
    reader = new FileReader()
    reader.onload = (event) ->
      loadImage(event.target.result)
      currentFilename = file.name
    reader.readAsDataURL(file)

  loadImage = (src) ->
    img = new Image()
    img.onload = ->
      currentImg = img
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      loadMarkings()
      filterImage()
    img.src = src

  filterImage = ->
    filteredCanvas.width = currentImg.width
    filteredCanvas.height = currentImg.height
    filteredImage = Filters.filterCanvas(Filters.thresholdRG, canvas, {threshold:$threshold.val()})
    ctxFiltered.putImageData(filteredImage, 0, 0)

  filterImage2 = ->
    convolutionMatrix = [  0, -1, 0,
      -1, 5, -1,
      0, -1, 0 ]
    filteredImage = Filters.filterCanvas(Filters.fastGaussian, canvas, convolutionMatrix)
    ctx.putImageData(filteredImage, 0, 0)


  init()


checkAPIsAvailable = ->
  if( typeof window.FileReader == 'undefined')
    alert("No local file reading possible. Please use a newer version of firefox or google chrome")

jq ->
  checkAPIsAvailable()
  initCellCounter()

