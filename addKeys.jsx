function main() {
  var myComp = restart();
  myLayer = myComp.layers.addText("hello word");
  centerLayer(myLayer);
  myAni(myLayer);
}

// 设置默认值
function defaultVal(x, value) {
  return typeof x !== "undefined" ? x : value;
}

// 删除所有合成
function removeComps() {
  while (app.project.numItems > 0) {
    app.project.item(1).remove();
  }
}

// 删除所有合成，然后新建合成
function restart(name) {
  name = defaultVal(name, "test");
  removeComps();
  var newComp = app.project.items.addComp(name, 1280, 720, 1, 10, 24);
  newComp.openInViewer();
  return newComp;
}

// 居中锚点，图层居中
function centerLayer(layer) {
  var comp = layer.containingComp;
  var curTime = comp.time;
  var layerAnchor = layer.anchorPoint.value;
  var x = layer.sourceRectAtTime(curTime, false).width / 2;
  var y = layer.sourceRectAtTime(curTime, false).height / 2;
  // if the layer is a text or shape layer
  if (layer instanceof TextLayer || layer instanceof ShapeLayer) {
    x += layer.sourceRectAtTime(curTime, false).left;
    y += layer.sourceRectAtTime(curTime, false).top;
  }
  layer.anchorPoint.setValue([x, y]);
  layer.position.setValue([comp.width / 2, comp.height / 2]);
}

// 添加关键帧例子
function myAni(myLayer) {
  myLayer.opacity.addKey(0);
  myLayer.opacity.addKey(2);
  myLayer.opacity.addKey(4);
  myLayer.opacity.setValueAtKey(1, 0);
  myLayer.opacity.setValueAtKey(2, 100);
  myLayer.opacity.setValueAtKey(3, 0);
}

// 添加关键这例子2
function myAni2() {
  angel = myComp.layer("control").effect("angle")("角度");
  for (var i = 0; i <= 48; i++) {
    angel.addKey((i * 8) / 48);
    angel.setValueAtKey(i + 1, (i * 360) / 48);
  }
}

// 凭借名字找合成
function findComp(name) {
  for (var i = 1; i <= app.project.numItems; i++) {
    if (app.project.item(i).name == name) return app.project.item(i);
  }
  return app.project.item(1);
}

// 添加表达式例子，这个例子是将48个图层围成圆形
function addExp() {
  for (var i = 1; i <= myComp.numLayers; i++) {
    if (i > 2) {
      exp =
        'angle = thisComp.layer("control").effect("angle")("角度") + 360 / 48 * ' +
        i +
        ';\n    radius = thisComp.layer("control").effect("radius")("滑块");\n    x = Math.sin(angle*Math.PI/180) * radius;\n    y = Math.cos(angle*Math.PI/180) * radius;    [x, 0, y]';
      myComp.layer(i).position.expression = exp;
      myComp.layer(i).scale.expression =
        'size = thisComp.layer("control").effect("size")("滑块");[size,size,size]';
    }
  }
}

function selectedLayer() {
  var theLayers = app.project.activeItem.selectedLayers;
  if (theLayers.length == 0) {
    return;
  }
  return theLayers;
}

function removeKeys(targetParam, val) {
  while (targetParam.numKeys > val) {
    targetParam.removeKey(val + 1);
  }
}

// 读txt文件，返回数组
function readFile(name) {
  var arr = [];
  var file = File(File($.fileName).parent.toString() + "/" + name);
  if (!file.open("r")) return [];
  while (!file.eof) {
    arr.push(file.readln());
  }
  file.close;
  return JSON.parse(arr);
}

function timeRemap(name) {
  var data = readFile(name);
  if (data.length == 0) {
    alert("Empty file.");
    return;
  }
  var arr;
  if (selectedLayer() === null) {
    alert("please select layer first.");
    return;
  }
  var myLayer = selectedLayer()[0];
  var myComp = myLayer.containingComp;
  var frameRate = myComp.frameRate;
  var duration = myLayer.source.duration - 1 / frameRate;
  // 对每一轨道复制一个layer，然后时间重映射
  for (var idx = 0; idx < data.length; idx++) {
    arr = data[idx];
    if (arr.length == 0) continue;
    myLayer.duplicate();
    myLayer.timeRemapEnabled = false;
    myLayer.timeRemapEnabled = true;
    removeKeys(myLayer.timeRemap, 1);
    removeKeys(myLayer.opacity, 0);
    myLayer.outPoint = arr[arr.length - 1][1];
    var s, e, pre_e;

    // 预处理
    var avg = 0;
    for (var i = 0; i < arr.length; i++) {
      arr[i][0] = parseInt(arr[i][0] * frameRate) / frameRate;
      arr[i][1] = parseInt(arr[i][1] * frameRate) / frameRate;
      if (i > 0 && arr[i][0] == arr[i - 1][1]) arr[i - 1][1] -= 1 / frameRate;
      avg += arr[i][1] - arr[i][0];
    }
    avg /= arr.length;

    // 添加关键帧
    var timeRemap = myLayer.timeRemap;
    var opacity = myLayer.opacity;
    for (var i = 0; i < arr.length; i++) {
      s = arr[i][0];
      e = arr[i][1];
      if (e - s < 1 / frameRate) continue;
      timeRemap.setValueAtKey(timeRemap.addKey(s), 0);
      timeRemap.setValueAtKey(timeRemap.addKey(e), duration);
      if (i > 0 && arr[i][0] - arr[i - 1][1] >= avg) {
        pre_e = arr[i - 1][1];
        opacity.setValueAtKey(opacity.addKey(pre_e), 100);
        opacity.setValueAtKey(opacity.addKey(pre_e + 0.004), 0);
        opacity.setValueAtKey(opacity.addKey(s - 0.004), 0);
        opacity.setValueAtKey(opacity.addKey(s), 100);
      }
    }
    myLayer = myComp.layer(myLayer.index - 1);
  }
}

timeRemap("midi.txt");
