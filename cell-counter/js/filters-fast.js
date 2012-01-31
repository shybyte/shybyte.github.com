if (typeof Filters === 'undefined') {
    Filters = {};
}

Filters.grayscale = function (pixels, args) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        // CIE luminance for the RGB
        // The human eye is bad at seeing red and blue, so we de-emphasize them.
        var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        d[i] = d[i + 1] = d[i + 2] = v
    }
    return pixels;
};


Filters.grayscaleRG = function (pixels, args) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var v = (r + g) / 2;
        d[i] = d[i + 1] = d[i + 2] = v
    }
    return pixels;
};

Filters.thresholdRG = function (pixels, args) {
    var d = pixels.data;
    var v;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        if ((r + g ) >> 1 > args.threshold) {
            v = 255
        } else {
            v = 0
        }
        d[i] = 0;
        d[i + 1] = v;
        d[i + 2] = 0;
        d[i + 3] = v
    }
    return pixels;
}

if (typeof(isCanvasSupported) !== 'undefined' && isCanvasSupported()) {
    Filters.tmpCanvas = document.createElement('canvas');
    Filters.tmpCtx = Filters.tmpCanvas.getContext('2d');
}

Filters.createImageData = function (w, h) {
    return this.tmpCtx.createImageData(w, h);
};

Filters.convolute = function (pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    // pad output by the convolution matrix
    var w = sw;
    var h = sh;
    var output = Filters.createImageData(w, h);
    var dst = output.data;
    // go through the destination image pixels
    var alphaFac = opaque ? 1 : 0;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var sy = y;
            var sx = x;
            var dstOff = (y * w + x) * 4;
            // calculate the weighed sum of the source image pixels that
            // fall under the convolution matrix
            var r = 0, g = 0, b = 0, a = 0;
            for (var cy = 0; cy < side; cy++) {
                for (var cx = 0; cx < side; cx++) {
                    var scy = sy + cy - halfSide;
                    var scx = sx + cx - halfSide;
                    if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                        var srcOff = (scy * sw + scx) * 4;
                        var wt = weights[cy * side + cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff + 1] * wt;
                        b += src[srcOff + 2] * wt;
                        a += src[srcOff + 3] * wt;
                    }
                }
            }
            dst[dstOff] = r;
            dst[dstOff + 1] = g;
            dst[dstOff + 2] = b;
            dst[dstOff + 3] = a + alphaFac * (255 - a);
        }
    }
    return output;
};


Filters.fastGaussian = function (pixels) {
    var kernel = [0.06, 0.061, 0.242, 0.383, 0.242, 0.061, 0.06];
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    var w = sw;
    var h = sh;
    var output1 = Filters.createImageData(w, h);
    var dst1 = output1.data;
    var dst = dst1;

    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var sy = y;
            var sx = x;
            var r = 0, g = 0, b = 0, a = 0;
            var srcOff = (y * w + x - 3) * 4;
            for (var i = 0; i < kernel.length; i++) {
                var wt = kernel[i];
                r += src[srcOff++] * wt;
                g += src[srcOff++] * wt;
                b += src[srcOff++] * wt;
                srcOff++
            }
            var dstOff = (y * w + x) * 4;
            dst[dstOff++] = r;
            dst[dstOff++] = g;
            dst[dstOff++] = b;
            dst[dstOff] = 255;
        }
    }
    var src = dst1;

    var output2 = Filters.createImageData(w, h);
    var dst2 = output2.data;
    var dst = dst2;

    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var sy = y;
            var sx = x;
            var r = 0, g = 0, b = 0, a = 0;
            var srcOff = ((y - 3) * w + x) * 4;
            for (var i = 0; i < kernel.length; i++) {
                var wt = kernel[i] / 1.109;
                var srcOff2 = srcOff + i * 4 * w;
                r += src[srcOff2++] * wt;
                g += src[srcOff2++] * wt;
                b += src[srcOff2] * wt;
            }

            var dstOff = (y * w + x) * 4;
            dst[dstOff++] = r;
            dst[dstOff++] = g;
            dst[dstOff++] = b;
            dst[dstOff] = 255;
        }
    }

    return output2;
};

Filters.compressedGrayScaleFromRedGreen = function (pixels) {
    var src = pixels.data;
    var grayScale = [];
    var size = pixels.width * pixels.height;
    var srcIndex = 0;
    for (var i = 0; i < size; i++) {
        grayScale[i] = (src[srcIndex]+src[srcIndex+1])/2;
        srcIndex += 4;
    }
    return {
        data:grayScale,
        width:pixels.width,
        height:pixels.height
    }
}

Filters.cloneImageDataAsNormalObject = function (pixels) {
    var src = pixels.data;
    var normalArray = [];
    var size = pixels.width * pixels.height*4;
    for (var i = 0; i < size; i++) {
        normalArray[i] = src[i];
    }
    return {
        data:normalArray,
        width:pixels.width,
        height:pixels.height
    }
}


Filters.compressedGrayScaleFromRedGreenBlue = function (pixels) {
    var src = pixels.data;
    var grayScale = [];
    var size = pixels.width * pixels.height;
    var srcIndex = 0;
    for (var i = 0; i < size; i++) {
        grayScale[i] = (src[srcIndex]*0.2126 +src[srcIndex+1]*0.7152+src[srcIndex+2]*0.0722);
        srcIndex += 4;
    }
    return {
        data:grayScale,
        width:pixels.width,
        height:pixels.height
    }
}

Filters.compressedGrayScaleFromRed = function (pixels) {
    var src = pixels.data;
    var grayScale = [];
    var size = pixels.width * pixels.height;
    var srcIndex = 0;
    for (var i = 0; i < size; i++) {
        grayScale[i] = src[srcIndex];
        srcIndex += 4;
    }
    return {
        data:grayScale,
        width:pixels.width,
        height:pixels.height
    }
}


Filters.imageDataFromCompressedGrayScale = function (pixels) {
    var imageData = Filters.createImageData(pixels.width, pixels.height);
    var src = pixels.data;
    var grayScale = [];
    var size = pixels.width * pixels.height;
    var dst = imageData.data;
    var destIndex = 0;
    for (var i = 0; i < size; i++) {
        dst[destIndex] = dst[destIndex + 1] = dst[destIndex + 2] = src[i];
        dst[destIndex + 3] = 255;
        destIndex += 4;
    }
    return imageData;
}


Filters.meanCGSRepeated = function (pixels, meanSize, repetitions,reportProgress) {
    var tempResult = pixels;
    for (var i = 0; i < repetitions; i++) {
        tempResult = Filters.meanCGS(tempResult, meanSize);
        reportProgress && reportProgress(i/repetitions)
    }
    return tempResult;
}

Filters.meanCGS = function (pixels, meanSize) {
    //    return Filters.meanCGSHorizontal(pixels, meanSize);
    //    return Filters.meanCGSVertical(pixels, meanSize);
    return Filters.meanCGSHorizontal(Filters.meanCGSVertical(pixels, meanSize), meanSize);
}

Filters.meanCGSHorizontal = function (pixels, meanSize) {
    var src = pixels.data;
    var w = pixels.width;
    var h = pixels.height;
    var size = w * h;
    var dst = [];
    var sum = 0;
    var posLeft = 0;

    initArray(dst, size);

    var meanSizeHalf = Math.floor(meanSize / 2)
    for (var i = meanSize; i < size; i++) {
        sum = sum + src[i] - src[posLeft++];
        dst[i - meanSizeHalf] = sum / meanSize;
    }

    return {
        data:dst,
        width:pixels.width,
        height:pixels.height
    }
}

Filters.meanCGSVertical = function (pixels, meanSize) {
    var src = pixels.data;
    var w = pixels.width;
    var h = pixels.height;
    var size = w * h;
    var dst = [];

    initArray(dst, size);

    var meanSizeHalf = Math.floor(meanSize / 2);
    var meanSizeHalfOffset = meanSizeHalf * w;

    for (var x = 0; x < w; x++) {
        var sum = 0;
        var posUp = x - meanSizeHalf * w;
        var posDown = x + (meanSizeHalf + 1) * w;
        var i = x;
        for (var y = 0; y < h; y++) {
            sum = sum + (posDown < size ? src[posDown] : 0) - (posUp >= 0 ? src[posUp] : 0);
            dst[i+w] = sum / meanSize;
            posUp += w;
            posDown += w;
            i += w;
        }
    }

    return {
        data:dst,
        width:pixels.width,
        height:pixels.height
    }
}


Filters.peaksCGSOld = function (pixels, minHeight) {
    var src = pixels.data;
    var w = pixels.width;
    var h = pixels.height;
    var size = w * h;
    var dst = [];
    initArray(dst, size);
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var i = y * w + x;
            var v = src[i];
            if (v > minHeight && v >= src[i + 1] && v >= src[i - 1] && v >= src[i - w] && v >= src[i + w]) {
                dst[i] = 255;
            }
        }
    }

    return {
        data:dst,
        width:pixels.width,
        height:pixels.height
    }
}


Filters.peaksCGS = function (pixels, minHeight, minDist) {
    var src = pixels.data;
    var w = pixels.width;
    var h = pixels.height;
    var size = w * h;
    var peaks = [];
    var dst = [];
    initArray(dst, size);
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var i = y * w + x;
            var v = src[i];
            if (v >= minHeight) {
                dst[i] = 255;
                var maxX = Math.min(x + minDist, w);
                IsMaxLoop:
                    for (var x2 = Math.max(x - minDist, 0); x2 < maxX; x2++) {
                        var maxY = Math.min(y + minDist, h);
                        for (var y2 = Math.max(y - minDist, 0); y2 < maxY; y2++) {
                            if (v < src[y2 * w + x2] && (x != x2 || y != y2)) {
                                dst[i] = 0;
                                break IsMaxLoop;
                            }
                        }
                    }
                if (dst[i] == 255) {
                    peaks.push({x:x, y:y});
                }
            }
        }
    }

    return {
        data:dst,
        width:pixels.width,
        height:pixels.height,
        peaks:peaks
    }
}

Filters.thresholdCGS = function (pixels, minHeight) {
    var src = pixels.data;
    var w = pixels.width;
    var h = pixels.height;
    var size = w * h;
    var dst = [];
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var i = y * w + x;
            var v = src[i];
            if (v >= minHeight) {
                dst[i] = 255;
            } else {
                dst[i] = 0;
            }
        }
    }

    return {
        data:dst,
        width:pixels.width,
        height:pixels.height
    }
}

function initArray(array, size) {
    for (var i = 0; i < size; i++) {
        array[i] = 0;
    }
}