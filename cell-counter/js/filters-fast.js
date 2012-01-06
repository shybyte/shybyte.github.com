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

Filters.thresholdRG = function (pixels, args) {
    var d = pixels.data;
    var v;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        if ((r + g )>>1 > args.threshold) {
            v = 255
        } else {
            v = 0
        }
        d[i] = 0;
        d[i + 1] = v ;
        d[i + 2] = 0 ;
        d[i + 3] = v
    }
    return pixels;
}


Filters.tmpCanvas = document.createElement('canvas');
Filters.tmpCtx = Filters.tmpCanvas.getContext('2d');

Filters.createImageData = function(w,h) {
    return this.tmpCtx.createImageData(w,h);
};

Filters.convolute = function(pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side/2);
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
    for (var y=0; y<h; y++) {
        for (var x=0; x<w; x++) {
            var sy = y;
            var sx = x;
            var dstOff = (y*w+x)*4;
            // calculate the weighed sum of the source image pixels that
            // fall under the convolution matrix
            var r=0, g=0, b=0, a=0;
            for (var cy=0; cy<side; cy++) {
                for (var cx=0; cx<side; cx++) {
                    var scy = sy + cy - halfSide;
                    var scx = sx + cx - halfSide;
                    if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                        var srcOff = (scy*sw+scx)*4;
                        var wt = weights[cy*side+cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff+1] * wt;
                        b += src[srcOff+2] * wt;
                        a += src[srcOff+3] * wt;
                    }
                }
            }
            dst[dstOff] = r;
            dst[dstOff+1] = g;
            dst[dstOff+2] = b;
            dst[dstOff+3] = a + alphaFac*(255-a);
        }
    }
    return output;
};


Filters.fastGaussian = function(pixels) {
    var kernel = [0.06, 0.061, 0.242, 0.383, 0.242, 0.061, 0.06];
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    var w = sw;
    var h = sh;
    var output1 = Filters.createImageData(w, h);
    var dst1 = output1.data;
    var dst = dst1;

    for (var y=0; y<h; y++) {
        for (var x=0; x<w; x++) {
            var sy = y;
            var sx = x;
            var r=0, g=0, b=0, a=0;
            var srcOff = (y*w+x-3)*4;
            for(var i=0;i<kernel.length;i++) {
                var wt = kernel[i]/1.109;
                var srcOff2 = srcOff+i*4;
                r += src[srcOff2++] * wt;
                g += src[srcOff2++] * wt;
                b += src[srcOff2] * wt;
            }
            var dstOff = (y*w+x)*4;
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

    for (var y=0; y<h; y++) {
        for (var x=0; x<w; x++) {
            var sy = y;
            var sx = x;
            var r=0, g=0, b=0, a=0;
            var srcOff = ((y-3)*w+x)*4;
            for(var i=0;i<kernel.length;i++) {
                var wt = kernel[i]/1.109;
                var srcOff2 = srcOff+i*4*w;
                r += src[srcOff2++] * wt;
                g += src[srcOff2++] * wt;
                b += src[srcOff2] * wt;
            }

            var dstOff = (y*w+x)*4;
            dst[dstOff++] = r;
            dst[dstOff++] = g;
            dst[dstOff++] = b;
            dst[dstOff] = 255;
        }
    }

    return output2;
};