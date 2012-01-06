(function() {
  var Marking, checkAPIsAvailable, draggedMarking, initCellCounter, markingsIdCounter;
  markingsIdCounter = 0;
  draggedMarking = null;
  Marking = (function() {
    function Marking(pos, type) {
      var self;
      this.pos = pos;
      this.type = type;
      self = this;
      this.id = markingsIdCounter++;
      this.el = jq('<div/>').addClass('marking markingType' + this.type).attr({
        id: this.id,
        draggable: false
      }).bind('dragend', function() {
        return log('dragend');
      }).bind('dragstart', function() {
        self.el.css('opacity', '0.4');
        draggedMarking = self;
        return log("dragstart");
      });
      this.move(pos);
    }
    Marking.prototype.move = function(pos) {
      var screenPos;
      this.pos = pos;
      screenPos = {
        left: pos.x,
        top: pos.y
      };
      return this.el.css(screenPos);
    };
    return Marking;
  })();
  initCellCounter = function() {
    var $canvas, $fadeThresholdImage, $markings, $markingsSize, $threshold, addMarking, canvas, changeFading, ctx, ctxFiltered, currentImg, eventPosInCanvas, filterImage, filterImage2, filteredCanvas, findNearestMarking, init, initDragAndDrop, initManualCounter, initSliders, loadImage, loadLocalImage, markings, onChangeMarkingsSize, removeAllMarkings, removeMarking, showCellCount;
    $threshold = jq('#threshold');
    $fadeThresholdImage = jq('#fadeThresholdImage');
    $markingsSize = jq('#markingsSize');
    currentImg = null;
    $canvas = jq('#mainCanvas');
    canvas = $canvas.get(0);
    filteredCanvas = jq('#filteredCanvas').get(0);
    ctx = canvas.getContext('2d');
    ctxFiltered = filteredCanvas.getContext('2d');
    markings = [];
    $markings = jq('#markings');
    init = function() {
      initDragAndDrop();
      initManualCounter();
      initSliders();
      loadImage('images/nora1.jpg');
      jq('#removeAllMarkings').click(removeAllMarkings);
      return jq('#filterButton').click(filterImage2);
    };
    initDragAndDrop = function() {
      return $markings.bind('dragover', function() {
        return false;
      }).bind('dragleave', function() {
        canvas.className = '';
        return false;
      }).bind('drop', function(e) {
        canvas.className = '';
        e.preventDefault();
        if (e.originalEvent.dataTransfer.files.length > 0) {
          return loadLocalImage(e.originalEvent.dataTransfer.files[0]);
        } else if (draggedMarking) {
          return log("nada");
        }
      });
    };
    initSliders = function() {
      var bindSliderChange, bindSliderChangeAndSlide;
      bindSliderChange = function($slider, onChange) {
        return $slider.hide().rangeinput().change(onChange);
      };
      bindSliderChangeAndSlide = function($slider, onChange) {
        return bindSliderChange($slider, onChange).bind('onSlide', onChange);
      };
      $markingsSize = bindSliderChangeAndSlide($markingsSize, onChangeMarkingsSize);
      $threshold = bindSliderChange($threshold, filterImage);
      return $fadeThresholdImage = bindSliderChangeAndSlide($fadeThresholdImage, changeFading);
    };
    onChangeMarkingsSize = function() {
      var cssRule, newMarkingsSize;
      cssRule = getCSSRule('.marking');
      newMarkingsSize = $markingsSize.val();
      cssRule.style.width = newMarkingsSize + 'px';
      cssRule.style.height = newMarkingsSize + 'px';
      cssRule.style.marginLeft = -newMarkingsSize / 2 + 'px';
      return cssRule.style.marginTop = -newMarkingsSize / 2 + 'px';
    };
    eventPosInCanvas = function(e) {
      var canvasOffset;
      canvasOffset = $canvas.offset();
      return {
        x: e.pageX - canvasOffset.left,
        y: e.pageY - canvasOffset.top
      };
    };
    initManualCounter = function() {
      $markings.click(function(e) {
        var pos;
        pos = eventPosInCanvas(e);
        if (e.ctrlKey && markings.length > 0) {
          return removeMarking(pos);
        } else {
          return addMarking(pos);
        }
      });
      return $markings.bind('contextmenu', function(e) {
        e.preventDefault();
        return removeMarking(eventPosInCanvas(e));
      });
    };
    changeFading = function() {
      var v, v1, v2;
      v = $fadeThresholdImage.val();
      v = v / 128;
      if (v < 1) {
        v1 = 1;
        v2 = v;
      } else {
        v1 = 2 - v;
        v2 = 1;
      }
      jq('#mainCanvas').css('opacity', v1);
      return jq('#filteredCanvas').css('opacity', v2);
    };
    addMarking = function(pos) {
      var marking, markingType;
      markingType = jq('input:radio[name=markingColor]:checked').val();
      marking = new Marking(pos, markingType);
      markings.push(marking);
      $markings.append(marking.el);
      return showCellCount();
    };
    removeMarking = function(pos) {
      var marking;
      marking = findNearestMarking(pos.x, pos.y);
      if (marking) {
        markings = _.without(markings, marking);
        marking.el.remove();
        return showCellCount();
      }
    };
    removeAllMarkings = function() {
      var marking, _i, _len;
      for (_i = 0, _len = markings.length; _i < _len; _i++) {
        marking = markings[_i];
        marking.el.remove();
      }
      markings = [];
      return showCellCount();
    };
    showCellCount = function() {
      var countByCellType, groupedMarkings;
      groupedMarkings = _.groupBy(markings, 'type');
      countByCellType = function(type2) {
        var _ref, _ref2;
        return (_ref = ((_ref2 = groupedMarkings[type2]) != null ? _ref2.length : void 0)) != null ? _ref : 0;
      };
      jq('#cellCount0').text(countByCellType(0));
      return jq('#cellCount1').text(countByCellType(1));
    };
    findNearestMarking = function(x, y) {
      return _.min(markings, function(marking) {
        var dx, dy;
        dx = marking.pos.x - x;
        dy = marking.pos.y - y;
        return dx * dx + dy * dy;
      });
    };
    loadImage = function(src) {
      var img;
      img = new Image();
      img.onload = function() {
        currentImg = img;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        return filterImage();
      };
      return img.src = src;
    };
    loadLocalImage = function(file) {
      var reader;
      reader = new FileReader();
      reader.onload = function(event) {
        return loadImage(event.target.result);
      };
      return reader.readAsDataURL(file);
    };
    filterImage = function() {
      var filteredImage;
      filteredCanvas.width = currentImg.width;
      filteredCanvas.height = currentImg.height;
      filteredImage = Filters.filterCanvas(Filters.thresholdRG, canvas, {
        threshold: $threshold.val()
      });
      return ctxFiltered.putImageData(filteredImage, 0, 0);
    };
    filterImage2 = function() {
      var convolutionMatrix, filteredImage;
      convolutionMatrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      filteredImage = Filters.filterCanvas(Filters.fastGaussian, canvas, convolutionMatrix);
      return ctx.putImageData(filteredImage, 0, 0);
    };
    return init();
  };
  checkAPIsAvailable = function() {
    if (typeof window.FileReader === 'undefined') {
      return alert("No local file reading possible. Please use a newer version of firefox or google chrome");
    }
  };
  jq(function() {
    checkAPIsAvailable();
    return initCellCounter();
  });
}).call(this);
