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
      return this.pos = pos;
    };
    Marking.prototype.updateScreenPos = function(canvas, $canvas) {
      var screenPos;
      screenPos = {
        left: this.pos.x / canvas.width * $canvas.width(),
        top: this.pos.y / canvas.height * $canvas.height()
      };
      return this.el.css(screenPos);
    };
    return Marking;
  })();
  initCellCounter = function() {
    var $canvas, $fadeThresholdImage, $markings, $markingsSize, $threshold, addMarking, addMarkingWithSelectedType, canvas, changeFading, ctx, ctxFiltered, currentFilename, currentImg, eventPosInImage, filterImage, filterImage2, filteredCanvas, findNearestMarking, init, initDragAndDrop, initManualCounter, initOnResize, initReadFile, initSliders, loadImage, loadLocalImage, loadMarkings, markings, onChangeMarkingsSize, onRemoveAllMarkings, removeAllMarkings, removeMarking, saveMarkings, showCellCount;
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
    currentFilename = "";
    init = function() {
      initReadFile();
      initDragAndDrop();
      initManualCounter();
      initSliders();
      loadImage('images/nora1.jpg');
      initOnResize();
      jq('#removeAllMarkings').click(removeAllMarkings);
      return jq('#filterButton').click(filterImage2);
    };
    initOnResize = function() {
      return jq(window).resize(function(e) {
        var marking, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = markings.length; _i < _len; _i++) {
          marking = markings[_i];
          _results.push(marking.updateScreenPos(canvas, $canvas));
        }
        return _results;
      });
    };
    loadMarkings = function() {
      var markingData, markingsData, markingsDataString, _i, _len, _results;
      removeAllMarkings();
      markingsDataString = localStorage['markings_data_' + currentFilename] || "[]";
      markingsData = JSON.parse(markingsDataString);
      _results = [];
      for (_i = 0, _len = markingsData.length; _i < _len; _i++) {
        markingData = markingsData[_i];
        _results.push(addMarking(markingData.pos, markingData.type));
      }
      return _results;
    };
    saveMarkings = function() {
      var marking, markingsData;
      markingsData = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = markings.length; _i < _len; _i++) {
          marking = markings[_i];
          _results.push({
            pos: marking.pos,
            type: marking.type
          });
        }
        return _results;
      })();
      return localStorage['markings_data_' + currentFilename] = JSON.stringify(markingsData);
    };
    initReadFile = function() {
      var $openFile;
      $openFile = jq('#openFile');
      return $openFile.change(function() {
        var files;
        files = $openFile.get(0).files;
        return loadLocalImage(files[0]);
      });
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
    initManualCounter = function() {
      $markings.click(function(e) {
        var pos;
        pos = eventPosInImage(e);
        log(pos);
        if (e.ctrlKey && markings.length > 0) {
          return removeMarking(pos);
        } else {
          return addMarkingWithSelectedType(pos);
        }
      });
      return $markings.bind('contextmenu', function(e) {
        e.preventDefault();
        return removeMarking(eventPosInImage(e));
      });
    };
    eventPosInImage = function(e) {
      var eventPosInCanvas, p;
      eventPosInCanvas = function(e) {
        var canvasOffset;
        canvasOffset = $canvas.offset();
        return {
          x: e.pageX - canvasOffset.left,
          y: e.pageY - canvasOffset.top
        };
      };
      p = eventPosInCanvas(e);
      return {
        x: Math.round(p.x / $canvas.width() * canvas.width),
        y: Math.round(p.y / $canvas.height() * canvas.height)
      };
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
    addMarkingWithSelectedType = function(pos) {
      addMarking(pos, jq('input:radio[name=markingColor]:checked').val());
      return saveMarkings();
    };
    addMarking = function(pos, type) {
      var marking;
      marking = new Marking(pos, type);
      markings.push(marking);
      $markings.append(marking.el);
      marking.updateScreenPos(canvas, $canvas);
      return showCellCount();
    };
    removeMarking = function(pos) {
      var marking;
      marking = findNearestMarking(pos.x, pos.y);
      if (marking) {
        markings = _.without(markings, marking);
        marking.el.remove();
        showCellCount();
        return saveMarkings();
      }
    };
    onRemoveAllMarkings = function() {
      removeAllMarkings();
      return saveMarkings();
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
    loadLocalImage = function(file) {
      var reader;
      reader = new FileReader();
      reader.onload = function(event) {
        loadImage(event.target.result);
        return currentFilename = file.name;
      };
      return reader.readAsDataURL(file);
    };
    loadImage = function(src) {
      var img;
      img = new Image();
      img.onload = function() {
        currentImg = img;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        loadMarkings();
        return filterImage();
      };
      return img.src = src;
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
