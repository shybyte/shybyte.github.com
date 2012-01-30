if typeof(Filters) == 'undefined'
  importScripts('filters-fast.js')

addEventListener('message', (e)->
  data = e.data;
  switch data.cmd
    when 'start'
      postMessage('WORKER STARTED: ' + data.msg)
    when 'autocount'
      if  data.imageType == 'whiteOnBlue'
        cgs = Filters.compressedGrayScaleFromRedGreen(data.imageData)
      else
        cgs = Filters.compressedGrayScaleFromRedGreenBlue(data.imageData)
      filteredCGS = cgs;
      postProgress(0.1)
      filteredCGS = Filters.meanCGSRepeated(filteredCGS,5,4, (p)->
        postProgress(p*0.7+0.1)
      )
      postProgress(0.8)
      filteredCGS = Filters.peaksCGS(filteredCGS,data.threshold,3)
      postProgress(1.0)
      postMessage({cmd:'autocount',result:filteredCGS.peaks})
, false)

postProgress = (p) ->
  postMessage({cmd:'autocountProgress',result:p})