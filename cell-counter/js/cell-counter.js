(function() {
  var ALL_MARKING_TYPES, BROWSER_TO_OLD_MESSAGE, Marking, TOOL_MODE, draggedMarking, enabledMarkingTypes, initCellCounter, initConfigureDialog, initUpdateMessage, markingsIdCounter, toolMode;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  markingsIdCounter = 0;
  draggedMarking = null;
  ALL_MARKING_TYPES = ['0', '1', '2', '3', '4'];
  enabledMarkingTypes = ['0', '1'];
  TOOL_MODE = {
    MARKING: "marking",
    CROP: "crop"
  };
  toolMode = TOOL_MODE.MARKING;
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
    Marking.prototype.updateScreenPos = function(canvas, $canvas, cropWindowPos) {
      var screenPos;
      screenPos = {
        left: (this.pos.x - cropWindowPos.x) / canvas.width * $canvas.width(),
        top: (this.pos.y - cropWindowPos.y) / canvas.height * $canvas.height()
      };
      return this.el.css(screenPos);
    };
    return Marking;
  })();
  initCellCounter = function() {
    var $canvas, $fadeThresholdImage, $markings, $markingsSize, $restoreOriginalImageLink, $restoreSavedCroppingLink, $threshold, addMarking, addMarkingWithSelectedType, canvas, changeFading, configureEnabledMarkingTypes, cropWindow, ctx, ctxFiltered, currentFilename, currentImg, eventPosInCanvas, eventPosInImage, filterImage, filterImage2, filteredCanvas, findNearestMarking, getSelectedMarkingType, init, initAutoCounter, initCropTool, initDragAndDrop, initHelp, initManualCounter, initOnResize, initReadFile, initSliders, loadForCurrentImage, loadImage, loadLocalImage, loadMarkings, loadSavedCropWindow, loadSettings, markings, onChangeMarkingsSize, onImageLoaded, onRemoveAllMarkings, removeAllMarkings, removeMarking, saveForCurrentImage, saveMarkings, saveSettings, savedCropWindow, showCellCount, warnIfNoFileReaderAvailable;
    $threshold = jq('#threshold');
    $fadeThresholdImage = jq('#fadeThresholdImage');
    $markingsSize = jq('#markingsSize');
    $restoreOriginalImageLink = $('#restoreOriginalImageLink');
    $restoreSavedCroppingLink = $('#restoreSavedCroppingLink');
    currentImg = null;
    $canvas = jq('#mainCanvas');
    canvas = $canvas.get(0);
    filteredCanvas = jq('#filteredCanvas').get(0);
    ctx = canvas.getContext('2d');
    ctxFiltered = filteredCanvas.getContext('2d');
    cropWindow = {
      x: 0,
      y: 0
    };
    savedCropWindow = null;
    markings = [];
    $markings = jq('#markings');
    currentFilename = "";
    init = function() {
      warnIfNoFileReaderAvailable();
      loadSettings();
      initConfigureDialog(configureEnabledMarkingTypes);
      initHelp();
      configureEnabledMarkingTypes();
      initReadFile();
      initDragAndDrop();
      initManualCounter();
      initAutoCounter();
      initCropTool();
      initSliders();
      loadImage('images/nora1.jpg');
      initOnResize();
      $('#removeAllMarkings').click(onRemoveAllMarkings);
      return $('#filterButton').click(filterImage2);
    };
    initHelp = function() {
      return $("#helpLink").overlay({
        mask: {
          color: '#ebecff',
          loadSpeed: 200,
          opacity: 0.7
        },
        closeOnClick: false
      });
    };
    initCropTool = function() {
      var $canvasAndHelpContainer, $cropSelection, $helpText, cropImage, cropMarkins, cropStartPosInCanvas, fixPointOrder, points;
      $canvasAndHelpContainer = $('#canvasAndHelpContainer');
      loadSavedCropWindow();
      $helpText = $('#helpText');
      $cropSelection = $('#cropSelection');
      points = null;
      cropStartPosInCanvas = null;
      $('#cropImageLink').click(function() {
        points = [];
        toolMode = TOOL_MODE.CROP;
        $helpText.text("Click the top left point! Press the ESC key to cancel cropping.");
        $helpText.show("slow");
        return $canvasAndHelpContainer.expose({
          color: '#333',
          onClose: function() {
            $helpText.hide();
            $cropSelection.hide('slow');
            return toolMode = TOOL_MODE.MARKING;
          }
        });
      });
      $markings.mousemove(function(e) {
        var h, pos, w;
        if (toolMode === TOOL_MODE.CROP && points.length === 1) {
          pos = eventPosInCanvas(e);
          w = pos.x - cropStartPosInCanvas.x;
          h = pos.y - cropStartPosInCanvas.y;
          return $cropSelection.css({
            width: w + 'px',
            height: h + 'px'
          });
        }
      });
      $markings.click(function(e) {
        var posInCanvas;
        if (toolMode === TOOL_MODE.CROP) {
          posInCanvas = eventPosInCanvas(e);
          $cropSelection.css({
            top: posInCanvas.y,
            left: posInCanvas.x,
            width: '5px',
            height: '5px'
          }).show();
          cropStartPosInCanvas = posInCanvas;
          points.push(eventPosInImage(e));
          if (points.length === 1) {
            return $helpText.text("Click the bottom right point! Press the ESC key to cancel cropping.");
          } else if (points.length > 1) {
            $.mask.close();
            fixPointOrder();
            return cropImage({
              x: points[0].x,
              y: points[0].y,
              width: points[1].x - points[0].x,
              height: points[1].y - points[0].y
            });
          }
        }
      });
      fixPointOrder = function() {
        var tempX, tempY;
        if (points[1].x < points[0].x) {
          tempX = points[0].x;
          points[0].x = points[1].x;
          points[1].x = tempX;
        }
        if (points[1].y < points[0].y) {
          tempY = points[0].y;
          points[0].y = points[1].y;
          return points[1].y = tempY;
        }
      };
      cropImage = function(newCropWindow) {
        var imageData;
        imageData = ctx.getImageData(newCropWindow.x - cropWindow.x, newCropWindow.y - cropWindow.y, newCropWindow.width, newCropWindow.height);
        cropWindow = newCropWindow;
        canvas.width = newCropWindow.width;
        canvas.height = newCropWindow.height;
        ctx.putImageData(imageData, 0, 0);
        filterImage();
        cropMarkins();
        $restoreOriginalImageLink.show('slow');
        return saveForCurrentImage('cropWindow', cropWindow);
      };
      cropMarkins = function() {
        var m, marking, pos, _i, _len, _ref, _ref2;
        for (_i = 0, _len = markings.length; _i < _len; _i++) {
          marking = markings[_i];
          pos = marking.pos;
          if ((cropWindow.x <= (_ref = pos.x) && _ref < cropWindow.x + canvas.width) && (cropWindow.y <= (_ref2 = pos.y) && _ref2 < cropWindow.y + canvas.height)) {
            marking.updateScreenPos(canvas, $canvas, cropWindow);
          } else {
            marking.el.remove();
            marking.removed = true;
          }
        }
        markings = (function() {
          var _j, _len2, _results;
          _results = [];
          for (_j = 0, _len2 = markings.length; _j < _len2; _j++) {
            m = markings[_j];
            if (!m.removed) {
              _results.push(m);
            }
          }
          return _results;
        })();
        saveMarkings();
        showCellCount();
        return $restoreSavedCroppingLink.hide('slow');
      };
      $restoreOriginalImageLink.click((function() {
        $restoreOriginalImageLink.hide('slow');
        return onImageLoaded(currentImg);
      }));
      return $restoreSavedCroppingLink.click((function() {
        return cropImage(savedCropWindow);
      }));
    };
    loadSavedCropWindow = function() {
      savedCropWindow = loadForCurrentImage('cropWindow', null);
      if (savedCropWindow) {
        return $restoreSavedCroppingLink.show('slow');
      } else {
        return $restoreSavedCroppingLink.hide('slow');
      }
    };
    initAutoCounter = function() {
      var $autoCountButton, $countingMessage, $countingProgress, autoCount, setCountingProgress, worker;
      $autoCountButton = $('#autoCountButton');
      $countingMessage = $('#countingMessage');
      $countingProgress = $('#countingProgress');
      setCountingProgress = function(p) {
        log(Math.round(p * 100).toString());
        return $countingProgress.text(Math.round(p * 100).toString());
      };
      worker = new Worker('js/webworkers.js');
      worker.addEventListener('message', function(e) {
        log('Worker said: ');
        log(e.data);
        switch (e.data.cmd) {
          case 'autocountProgress':
            return setCountingProgress(e.data.result);
          case 'autocount':
            return setTimeout(function() {
              var peak, selectedMarkingType, _i, _len, _ref;
              selectedMarkingType = getSelectedMarkingType();
              _ref = e.data.result;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                peak = _ref[_i];
                addMarking({
                  x: peak.x + cropWindow.x,
                  y: peak.y + cropWindow.y
                }, selectedMarkingType);
              }
              saveMarkings();
              $countingMessage.hide('slow');
              return $autoCountButton.attr("disabled", false);
            }, 7);
        }
      }, false);
      worker.postMessage({
        cmd: 'start',
        msg: 'bla'
      });
      autoCount = function() {
        var imageType, threshold;
        $autoCountButton.attr("disabled", true);
        removeAllMarkings();
        setCountingProgress(0);
        $countingMessage.show();
        imageType = $('#imageTypeSelector').val();
        threshold = $threshold.val();
        return setTimeout(function() {
          var imageData, ua;
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          ua = $.browser;
          if (ua.mozilla && ua.version.slice(0, 3) === "1.9") {
            imageData = Filters.cloneImageDataAsNormalObject(imageData);
          }
          return worker.postMessage({
            cmd: 'autocount',
            imageData: imageData,
            threshold: threshold,
            imageType: imageType
          });
        }, 7);
      };
      return $autoCountButton.click(autoCount);
    };
    initOnResize = function() {
      return jq(window).resize(function(e) {
        var marking, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = markings.length; _i < _len; _i++) {
          marking = markings[_i];
          _results.push(marking.updateScreenPos(canvas, $canvas, cropWindow));
        }
        return _results;
      });
    };
    saveSettings = function() {
      var settings;
      settings = {
        markingsSize: $markingsSize.val(),
        threshold: $threshold.val(),
        fadeThresholdImage: $fadeThresholdImage.val(),
        enabledMarkingTypes: enabledMarkingTypes
      };
      return localStorage['cell_counter_settings'] = JSON.stringify(settings);
    };
    loadSettings = function() {
      var settings, settingsString;
      settingsString = localStorage['cell_counter_settings'];
      if (settingsString) {
        settings = JSON.parse(settingsString);
        enabledMarkingTypes = settings.enabledMarkingTypes || ["0", "1"];
        $threshold.val(settings.threshold);
        $markingsSize.val(settings.markingsSize);
        $fadeThresholdImage.val(settings.fadeThresholdImage);
      }
      onChangeMarkingsSize();
      changeFading();
      return configureEnabledMarkingTypes();
    };
    configureEnabledMarkingTypes = function() {
      var $markingTypeSelectors, markingType, prevSelectedMarkingType, row, selectedMarkingType, _i, _len;
      saveSettings();
      $markingTypeSelectors = $('#markingTypeSelectors');
      prevSelectedMarkingType = getSelectedMarkingType();
      $markingTypeSelectors.empty();
      for (_i = 0, _len = enabledMarkingTypes.length; _i < _len; _i++) {
        markingType = enabledMarkingTypes[_i];
        row = "<div>\n<input id=\"markingTypeSelector" + markingType + "\" type=\"radio\" name=\"markingType\" value=\"" + markingType + "\">\n<label for=\"markingTypeSelector" + markingType + "\" class=\"markingLabel" + markingType + "\">Count: <span id=\"cellCount" + markingType + "\">0</span></label>\n</div>";
        $markingTypeSelectors.append(row);
      }
      selectedMarkingType = __indexOf.call(enabledMarkingTypes, prevSelectedMarkingType) >= 0 ? prevSelectedMarkingType : enabledMarkingTypes[0];
      $("#markingTypeSelector" + selectedMarkingType).prop('checked', true);
      return showCellCount();
    };
    loadMarkings = function() {
      var markingData, markingsData, _i, _len, _results;
      removeAllMarkings();
      markingsData = loadForCurrentImage('markings_data', []);
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
      return saveForCurrentImage('markings_data', markingsData);
    };
    loadForCurrentImage = function(key, defaultValue) {
      var loadedJSON, _ref;
      loadedJSON = localStorage["cell_counter_" + key + "_" + currentFilename];
      return (_ref = loadedJSON && JSON.parse(loadedJSON)) != null ? _ref : defaultValue;
    };
    saveForCurrentImage = function(key, data) {
      return localStorage["cell_counter_" + key + "_" + currentFilename] = JSON.stringify(data);
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
        var nada;
        canvas.className = '';
        e.preventDefault();
        if (e.originalEvent.dataTransfer.files.length > 0) {
          return loadLocalImage(e.originalEvent.dataTransfer.files[0]);
        } else if (draggedMarking) {
          return nada = 1;
        }
      });
    };
    initSliders = function() {
      var bindSliderChange, bindSliderChangeAndSlide;
      bindSliderChange = function($slider, onChange) {
        return $slider.hide().rangeinput().change(function() {
          saveSettings();
          return onChange();
        });
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
      if (cssRule) {
        newMarkingsSize = $markingsSize.val();
        cssRule.style.width = newMarkingsSize + 'px';
        cssRule.style.height = newMarkingsSize + 'px';
        cssRule.style.marginLeft = -newMarkingsSize / 2 + 'px';
        return cssRule.style.marginTop = -newMarkingsSize / 2 + 'px';
      } else {
        log('Try again to change marking size ...');
        return setTimeout(onChangeMarkingsSize, 1000);
      }
    };
    initManualCounter = function() {
      $markings.click(function(e) {
        var pos;
        if (toolMode === TOOL_MODE.MARKING) {
          pos = eventPosInImage(e);
          if (e.ctrlKey && markings.length > 0) {
            return removeMarking(pos);
          } else {
            return addMarkingWithSelectedType(pos);
          }
        }
      });
      return $markings.bind('contextmenu', function(e) {
        e.preventDefault();
        return removeMarking(eventPosInImage(e));
      });
    };
    eventPosInCanvas = function(e) {
      var canvasOffset;
      canvasOffset = $canvas.offset();
      return {
        x: e.pageX - canvasOffset.left,
        y: e.pageY - canvasOffset.top
      };
    };
    eventPosInImage = function(e) {
      var p;
      p = eventPosInCanvas(e);
      return {
        x: Math.round(p.x / $canvas.width() * canvas.width) + cropWindow.x,
        y: Math.round(p.y / $canvas.height() * canvas.height) + cropWindow.y
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
      addMarking(pos, getSelectedMarkingType());
      return saveMarkings();
    };
    getSelectedMarkingType = function() {
      return jq('input:radio[name=markingType]:checked').val();
    };
    addMarking = function(pos, type) {
      var marking;
      marking = new Marking(pos, type);
      markings.push(marking);
      $markings.append(marking.el);
      marking.updateScreenPos(canvas, $canvas, cropWindow);
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
      var countByCellType, groupedMarkings, markingType, _i, _len, _results;
      groupedMarkings = _.groupBy(markings, 'type');
      countByCellType = function(type2) {
        var _ref, _ref2;
        return (_ref = ((_ref2 = groupedMarkings[type2]) != null ? _ref2.length : void 0)) != null ? _ref : 0;
      };
      _results = [];
      for (_i = 0, _len = enabledMarkingTypes.length; _i < _len; _i++) {
        markingType = enabledMarkingTypes[_i];
        _results.push(jq("#cellCount" + markingType).text(countByCellType(markingType)));
      }
      return _results;
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
      $restoreOriginalImageLink.hide('slow');
      img = new Image();
      img.onload = function() {
        return onImageLoaded(img);
      };
      return img.src = src;
    };
    onImageLoaded = function(img) {
      cropWindow = {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height
      };
      currentImg = img;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      loadMarkings();
      loadSavedCropWindow();
      return filterImage();
    };
    filterImage = function() {
      var filteredImage;
      filteredCanvas.width = canvas.width;
      filteredCanvas.height = canvas.height;
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
    warnIfNoFileReaderAvailable = function() {
      var noFileReader;
      if (!window.FileReader) {
        noFileReader = "No local file reading possible. ";
        alert(noFileReader + BROWSER_TO_OLD_MESSAGE);
        return jq('#openFile').replaceWith(noFileReader + $canvas.html());
      }
    };
    return init();
  };
  initConfigureDialog = function(onNewEnabledMarkingTypes) {
    var $box;
    $box = $('#enabledMarkingTypesSelector');
    $("#configureLink").click(function() {
      var checked, markingRow, markingType, _i, _len, _results;
      $box.empty();
      _results = [];
      for (_i = 0, _len = ALL_MARKING_TYPES.length; _i < _len; _i++) {
        markingType = ALL_MARKING_TYPES[_i];
        checked = __indexOf.call(enabledMarkingTypes, markingType) >= 0 ? "checked" : "";
        markingRow = "<div>\n<input id=\"enableMarkingType" + markingType + "\" type=\"checkbox\" value=\"" + markingType + "\" " + checked + ">\n<label for=\"enableMarkingType" + markingType + "\" class=\"markingLabel" + markingType + "\">Cell Type " + markingType + "</label>\n                             </div>";
        _results.push($box.append(markingRow));
      }
      return _results;
    }).overlay({
      mask: {
        color: '#ebecff',
        loadSpeed: 200,
        opacity: 0.7
      },
      closeOnClick: false
    });
    return jq('#configureOKButton').click(function() {
      enabledMarkingTypes = [];
      $('input:checked', $box).each(function(i, el) {
        return enabledMarkingTypes.push($(el).val());
      });
      return onNewEnabledMarkingTypes();
    });
  };
  BROWSER_TO_OLD_MESSAGE = "Your browser is too old. Please use a newer version of firefox, google chrome or opera.";
  initUpdateMessage = function() {
    return window.applicationCache.addEventListener('updateready', function() {
      if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
        window.applicationCache.swapCache();
        if (confirm('A new version of "Marcos Cell Counter" is available. Load it now?')) {
          return window.location.reload();
        }
      }
    }, false);
  };
  jq(function() {
    if (isCanvasSupported()) {
      initUpdateMessage();
      return initCellCounter();
    } else {
      jq('#openFile').hide();
      return alert(BROWSER_TO_OLD_MESSAGE);
    }
  });
}).call(this);
