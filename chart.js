function Chart(name) {

  let id = name;

  //let price = 1000.0;

  let chartSymbol = "";
  let chartInterval = {};

  let bars = [];
  let barColors = [];
  let updateIndex = 0;

  let timeAxis = {};
  timeAxis.update = true;
  timeAxis.height = 13;
  timeAxis.ago1 = 100;
  timeAxis.ago2 = 0;
  timeAxis.change = false;
  timeAxis.scroll = false;
  timeAxis.labels = [];

  let scrollTimer;
  let scrollTime;
  let scrollPosition = [];
  let scrollVelocity;
  let scrollOffset = 0;

  let upSwipe = false;
  let dnSwipe = false;

  let loadOffset = 0;
  let loadCount = 500;

  let futureBars = 0;
  let minBars = 7;
  let maxBars = 5000;

  let textTopic;
  let text1 = "";

  let symbolLabel = [];
  let disclaimerLabel = [];
  let currentPriceLabel = [];

  let barWidth = 0.25;

  let mouseClick = false;
  let mouseClickPosition = [];
  let mouseScrollPosition = [];

  let mouseButton = false;
  let mouseButtonPosition = [];

  //let doubleTapTime = 0;
  let reset = false;
  let resetTimer;

  let messageId = 0;

  let panels = [];
  let studies = [];
  let buttons = [];

  let period = loadItem("QLRxPeriod");

  let QLRxPeriod = Math.max(4, (period.length > 0) ? parseInt(period, 10) : 50);

  //console.log("QLRxPeriod " + period.length + " " + "|" + period + "|" + " " + QLRxPeriod);

  let update = false;
  let updateTimer;

  let textWidth1 = getTextWidth("00:00");
  let textWidth2 = getTextWidth("00/00");
  let textWidth3 = getTextWidth("AAA 0000");
  let textWidth4 = getTextWidth("0000");

  //getTestData();

  // function loadBars(symbol, interval, start, end) {
  //   let request = new XMLHttpRequest();
  //   let text = "http://67.202.71.101/techchart/data/bar0.php";
  //   text += "?s=" + symbol;
  //   text += "&i=" + interval;
  //   text += "&b=" + start;
  //   text += "&e=" + end;
  //   text += "&c=" + phpHash(symbol, interval, start, end);
  //   request.open("GET", text, false);
  //   request.send(null);

  //   let data = request.responseText.split("\n");
  //   data.splice(0, 0, "1", "1", "2");
  //   setBars(data);
  // }

  // function phpHash(symbol, interval, start, end) {
  //   let s = symbol + interval + start + end;
  //   let nRes = 0;
  //   let sRes = "";
  //   let i = 0;
  //   for (i = 0; i < s.length; i++) {
  //     nRes += ((s.charCodeAt(i) + 72) * (i + 1 + (s.charCodeAt(i) % 7)));
  //   }
  //   for (i = 0; i < s.length; i++) {
  //     nRes += ((s.charCodeAt(i) + 59) * (s.length - i - 1 + (s.charCodeAt(i) % 9)));
  //   }
  //   nRes += 8291;
  //   nRes *= 7;
  //   nRes -= 97;
  //   nRes *= 11;
  //   nRes += 4289;
  //   while (nRes)
  //   {
  //     sRes += String.fromCharCode(65 + Math.floor(nRes % 10));
  //     nRes = Math.floor(nRes / 10);
  //   }
  //   return sRes;
  // }

  this.loadBars = function(symbol, interval, session, input) {

    chartSymbol = symbol;
    chartInterval = getInterval(interval, session);

    bars = [];
    for (b of input) {
      bars.push(b);
    }
    update = true;
  };

  function saveItem(name, value) {
    window.localStorage.setItem(name, value);
  }

  function loadItem(name) {
    var item = window.localStorage.getItem(name);
    return (item == null || item.length == 0) ? "" : item;
  }

  this.getSymbol = function() {
    return chartSymbol;
  };

  this.getInterval = function() {
    return chartInterval.symbol;
  };

  this.getBarCount = function() {
    return getXCount();
  };

  this.requestBars = function(symbol, interval, session, barCount) {

    d3.select("#input1").node().blur();
    PubSub.unsubscribe(textTopic);
    text1 = "";

    bars.length = 0;
    updateIndex = 0;

    // scroll to current time on symbol change
    //timeAxis.ago1 -= timeAxis.ago2;
    //timeAxis.ago2 -= timeAxis.ago2;

    loadOffset = 0;

    chartSymbol = symbol;
    chartInterval = getInterval(interval, session);

    //loadBars(symbol, "D", date, "20200101");

    loadCount = getXCount();
    if (loadCount === 0) {
      loadCount = barCount;
      if (loadCount === 0) {
        loadCount = 100;
      }
      timeAxis.update = true;
      timeAxis.ago1 = loadCount;
      timeAxis.ago2 = 0;
    }

    let count1 = loadCount;
    let count2 = futureBars;

    sendDataRequest(chartSymbol, chartInterval, count1, count2);
    loadCount = 1000;
  };

  function getMaxBars(interval)
  {
    let maxCnt = maxBars;
    if (interval == "2W") maxCnt = maxBars / 2.0;
    else if (interval == "M") maxCnt = maxBars / 4.0;
    else if (interval == "2M") maxCnt = maxBars / 8.0;
    else if (interval == "3M" || interval == "Q") maxCnt = maxBars / 12.0;
    maxCnt = Math.round(Math.max(400, maxCnt));
    return maxCnt;
  }

  function requestMoreBars(symbol, interval)
  {
    let count1 = Math.min(getMaxBars(interval), loadCount + loadOffset);
    let count2 = -loadOffset;
    sendDataRequest(symbol, interval, count1, count2);
  }

  function sendDataRequest(symbol, interval, count1, count2)
  {
     //if (webSocket != null) 
     {

      let oldId = messageId;
      messageId++;
      if (messageId >= 1000) {
        messageId -= 1000;
      }
      let newId = messageId;

      let serverInterval = interval.symbol + ((interval.session == 1) ? "a" : "");

      //console.log(serverInterval);

      let command = "0" + "," + oldId + ";" + "1" + "," + newId + "," + "bar" + "," + symbol + "," + serverInterval + "," + count1 + "," + count2;
      loadOffset += loadCount;

      //console.log(command);

      //webSocket.send(command);
    }
  }

  this.processMessage = function(message) {
    let msgType = parseInt(message[0]);
    //console.log(message);

    if (msgType === 0) {
      //console.log("Heartbeat");
    }
    else if (msgType === 1) {
      //console.log(message);
      let data1 = message.split(",");
      let msgId1 = parseInt(data1[1]);
      let flags = parseInt(data1[2]);
      if (msgId1 === messageId) {

        //setBars(data1);
        data1.splice(0, 1);

        updateBars(data1);

        update = true;

        if ((flags & 2) === 2 && loadCount > 0)
        {
          if (loadOffset < getMaxBars(chartInterval.symbol))
          {
            requestMoreBars(chartSymbol, chartInterval);
          }
          else
          {
            loadCount = 0;
            sendDataRequest(chartSymbol, chartInterval, 1, futureBars);
          }
        }

      }
    }
    else if (msgType === 2) {
      let data2 = message.split(",");
      let msgId2 = parseInt(data2[1]);
      if (msgId2 === messageId) {
        //console.log(message);
        updateBars(data2);
        update = true;
      }
    }
  };

  function getCurrentBarAgo() {
    let index = -1;
    let barCount = bars.length;
    for (let ago = 0; ago < barCount; ago++) {
      let idx  = barCount - 1 - ago;
      if (!isNaN(bars[idx].close)) {
        index = ago;
        break;
      }
    }
    return index;
  }

  function updateBars(data) {
    data.splice(0, 2);

    let dataCount = data.length;
    let barCount = bars.length;
    let sortBars = false;

    for (let ii = 0; ii < dataCount; ii++) {
      if (data[ii].length > 0) {
        let field = data[ii].split(":");

        let timeStamp = field[0] + "00";

        if (barCount > 0 && bars[updateIndex].timeStamp === timeStamp) {
          bars[updateIndex].open = parseFloat(field[1]);
          bars[updateIndex].high = parseFloat(field[2]);
          bars[updateIndex].low = parseFloat(field[3]);
          bars[updateIndex].close = parseFloat(field[4]);
          bars[updateIndex].volume = parseFloat(field[5]);
        }
        else {
          let found = 0;
          for (let jj = barCount - 1; jj >= 0; jj--) {
            let barTime = bars[jj].timeStamp;
            if (barTime === timeStamp) {
              bars[jj].open = parseFloat(field[1]);
              bars[jj].high = parseFloat(field[2]);
              bars[jj].low = parseFloat(field[3]);
              bars[jj].close = parseFloat(field[4]);
              bars[jj].volume = parseFloat(field[5]);
              updateIndex = jj;
              found = 1;
              break;
            }
            else if (barTime < timeStamp) {
              break;
            }
          }
          if (!found) {
            bars.push(
              new Bar(
                timeStamp,
                parseFloat(field[1]),
                parseFloat(field[2]),
                parseFloat(field[3]),
                parseFloat(field[4]),
                parseFloat(field[5])
              )
            );
            sortBars = true;
          }
        }
      }
    }

    if (sortBars) {
       bars.sort(
         function (a, b) { return (a.timeStamp > b.timeStamp? 1 : a.timeStamp < b.timeStamp ? -1 : 0); }
         );
    }

    timeAxis.update = true;
    for(let number = 0; number < 2; number++) {
      panels[number].priceAxis.update = true;
    }
  }

  function getChartIntervalText(interval) {
    if (interval.symbol === "Q") {
       return "QUARTERLY";
    }
    else if (interval.symbol === "3M") {
      return "QUARTERLY";
    }
    else if (interval.symbol === "2M") {
      return "TWO MONTH";
    }
    else if (interval.symbol === "M") {
      return "MONTHLY";
    }
    else if (interval.symbol === "2W") {
      return "TWO WEEK";
    }
    else if (interval.symbol === "W") {
      return "WEEKLY";
    }
    else if (interval.symbol === "2D") {
      return "TWO DAY";
    }
    else if (interval.symbol === "D") {
      return "DAILY";
    }
    else {
      return interval.amount + " MINUTE";
    }
  }

  function getInterval(input, session) {
    let output = {};
    output.symbol = input;
    if (input === "Q") {
      output.symbol = "3M";
      output.amount = 3;
      output.unit = "month";
      output.session = 0;
    }
    else if (input === "2M") {
      output.amount = 2;
      output.unit = "month";
      output.session = 0;
    }
    else if (input === "M") {
      output.amount = 1;
      output.unit = "month";
      output.session = 0;
    }
    else if (input === "2W") {
      output.amount = 2;
      output.unit = "week";
      output.session = 0;
    }
    else if (input === "W") {
      output.amount = 1;
      output.unit = "week";
      output.session = 0;
     }
    else if (input === "2D") {
      output.amount = 2;
      output.unit = "day";
      output.session = 0;
     }
    else if (input === "D") {
      output.amount = 1;
      output.unit = "day";
      output.session = 0;
    }
    else {
      output.amount = input;
      output.unit = "minute";
      output.session = session;
    }
    return output;
  }

  /*
  function getTestData() {

    let barCount = 10000;

    // only supports minute intervals
    let now = moment();
    let time = now.subtract(interval.amount * (barCount - 1), "minutes").startOf("minute");
    let minutes1 = time.minute() + 60 * time.hour();
    let minutes2 = minutes1 - (minutes1 % interval.amount);
    time.hours(minutes2 / 60);
    time.minutes(minutes2 % 60);
    let secondsPerBar = interval.amount * 60;
    let tradesPerBar = 30;
    let updateRate = secondsPerBar / tradesPerBar;

    for (let ii = 0; ii < barCount; ii++) {

      addBar(time.format("YYYYMMDDHHmmss"));

      for (let jj = 0; jj < tradesPerBar; jj++) {
        if (time > now) {
          break;
        }
        updateBar(ii, getTrade());
        time.add(updateRate, 'second');
      }
    }

    render();

    setInterval(function () {
      let now = moment();
      let time = now.startOf("minute");
      let minutes1 = time.minute() + 60 * time.hour();
      let minutes2 = minutes1 - (minutes1 % interval.amount);
      time.hours(minutes2 / 60);
      time.minutes(minutes2 % 60) ;

      if (time.format("YYYYMMDDHHmmss") !== bars[bars.length - 1].timeStamp) {
        removeBar();
        addBar(time.format("YYYYMMDDHHmmss"));
      }
      updateBar(bars.length - 1, getTrade());
      render();
    }, updateRate * 1000);
  }
*/

  this.initialize = function(activeStudies) {

    initializePanels();
    studies = activeStudies;

    updateTimer = setInterval(updateTimerEvent, 50);

    console.log(d3);

    let svg = d3.select("#" + id + "-div").append("svg");

    svg
      .append("defs");

    svg
    .attr("id", id)
    .attr("shape-rendering", "auto")
    .append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .style("fill", "#e0e0e0");

    svg.on("mousedown", mouseDown)
      .on("mouseup", mouseUp)
      .on("mousemove", mouseMove)
      .on("mouseenter", mouseEnter)
      .on("touchstart", touchStart)
      .on("touchmove", touchMove)
      .on("touchend", touchEnd)
      .on("mousewheel", mouseWheel);
  };

  this.setStudies = function(activeStudies) {
    studies = activeStudies;
    update = true;
  }

  function setClipRegions()
  {
    let svg = d3.select("#" + id);

    let panelCount = getPanelCount();

    for (let number = 0; number < panelCount; number++) {
      let r = getPanelRect(number);

      let clipName = "clip" + (number + 1).toString();
      let clipRectName = "clip-rect" + (number + 1).toString();

      svg.selectAll(clipRectName).remove();
      svg.selectAll(clipName).remove();

      let defs = d3.select("defs");

      defs
      .append("svg:clipPath")
      .attr("id", clipName)
      .append("svg:rect")
      .attr("id", clipRectName)
      .attr("x", r.left)
      .attr("y", r.top)
      .attr("width", r.right - r.left)
      .attr("height", r.bottom - r.top);
    }
  }

  this.onresize = function()
  {
    initializeDisclaimerLabel();
    timeAxis.update = true;
    for (let number = 0; number < 2; number++) {
      panels[number].priceAxis.update = true;
    }
    update = true;
  };

  function mouseDown()     { d3.event.preventDefault(); let p = d3.mouse(this); processMouseDown(p);}
  function mouseUp()       { d3.event.preventDefault(); let p = d3.mouse(this); processMouseUp(p);}
  function mouseMove()     { d3.event.preventDefault(); let p = d3.mouse(this); processMouseMove(p);}
  function mouseEnter()    { d3.event.preventDefault(); let p = d3.mouse(this); processMouseEnter(p);}
  function touchStart()    { d3.event.preventDefault(); let p = d3.mouse(this); processTouchStart(p);}
  function touchMove()     { d3.event.preventDefault(); let p = d3.mouse(this); processTouchMove(p);}
  function touchEnd()      { d3.event.preventDefault(); let p = d3.mouse(this); processTouchEnd(p);}
  function mouseWheel()    { d3.event.preventDefault(); let p = d3.mouse(this); processMouseWheel(p);}

  function processMouseDown(position) {

    upSwipe = false;
    dnSwipe = false;

    let buttonCount = buttons.length;
    let xOffset = bars.length - timeAxis.ago1 + getExtraCount() - 0.5;
    let x = getXScale();
    let y = getYScale(0);
    for (let ii = 0; ii < buttonCount; ii++) {
      let b = buttons[ii];
      let cx = x(b.x - xOffset);
      let cy = y(b.y);
      let xd = position[0] - cx;
      let yd = position[1] - cy;
      let d = Math.sqrt(xd * xd + yd * yd);
      if (d <= b.r) {
        mouseButton = true;
        mouseButtonPosition = position;
        break;
      }
    }

    if (!mouseButton) {
      mouseClick = true;
      mouseClickPosition = position;
      mouseScrollPosition = position;

      timeAxis.change = true;
      timeAxis.scroll = (mouseScrollPosition[1]) < (0.90 * getChartHeight());

      scrollVelocity = 0;
      scrollTime = Date.now();
      scrollPosition = position;
      clearInterval(scrollTimer);
      scrollTimer = setInterval(scrollTimerEvent, 50);

      reset = false;
      clearInterval(resetTimer);
      resetTimer = setInterval(resetTimerEvent, 500);
    }
  }

  let textChange = function(msg, data) {
    text1 = data;
    renderSymbolLabel();
  }

  function processMouseUp(position) {
    if (mouseButton) {
        mouseButton = false;
    }
    else {
      if (upSwipe) {
        //console.log("UP SWIPE");
        PubSub.publish('NAVIGATION', "Next Symbol");
      }
      else if (dnSwipe) {
        //console.log("DOWN SWIPE");
        PubSub.publish('NAVIGATION', "Previous Symbol");
      }
      else {
        let click = mouseClick && inClickRange(position);
        if (click && !reset) {

          textTopic = PubSub.subscribe('TEXT', textChange);
          d3.select("#input1").node().focus();

          mouseClick = false;
          //if (position[0] > 0.50 * getChartWidth() && position[1] < 0.90 * getChartHeight()) {
          //  PubSub.publish('NAVIGATION', "Forward");
          //}
          //else
          //if (position[0] < 0.50 * getChartWidth() && position[1] < 0.90 * getChartHeight()) {
          //  PubSub.publish('NAVIGATION', "Info");
          //}
        }
      }
      timeAxis.change = false;
      clearInterval(resetTimer);
    }
  }

  function processMouseMove(position) {

    if (mouseButton) {
      let x = getXScale();
      let range = getIndexRange();
      let index1 = range[0] + Math.round(x.invert(position[0]));
      let index2 = bars.length - getCurrentBarAgo() - 1;
      let period = Math.max(4, index2 - index1 + 1);
      if (period != QLRxPeriod) {
        QLRxPeriod = period;
        update = true;
        saveItem("QLRxPeriod", QLRxPeriod.toString());
      }
    }
    else {
      if (mouseClick && !inClickRange(position)) {
        mouseClick = false;
        clearInterval(resetTimer);
      }

      let xd = position[0] - mouseScrollPosition[0];
      let yd = position[1] - mouseScrollPosition[1];

      if (Math.abs(yd) > Math.abs(xd) && Math.abs(yd) > 10) {
        upSwipe = (yd < 0);
        dnSwipe = (yd > 0);
      }

      else if (timeAxis.change) {
        let speed = Math.max(0.25, getXCount() / 200.0);
        let amount1 = Math.round(speed * xd);
        if (amount1 !== 0) {
          let amount2 = timeAxis.scroll ? amount1 : 0;
          mouseScrollPosition = position;
          changeTimeAxis(amount1, amount2);
        }
      }
    }
  }

  function processTouchStart(position) {
    //d = d3.touches(this);
    //if (d.length == 2) {
    //  timeAxis.change = true;
    //  timeAxis.scroll = false;
    //}
    //else
    {
      processMouseDown(position);
    }
  }

  function processTouchMove(position) {
    processMouseMove(position);
  }

  function processTouchEnd(position) {
    processMouseUp(position);
  }

  function inClickRange(position)
  {
    return (Math.abs(mouseClickPosition[0] - position[0]) < 4 && Math.abs(mouseClickPosition[1] - position[1]) < 4);
  }

  function resetTimerEvent()
  {
    reset = true;
    timeAxis.update = true;
    timeAxis.ago1 = 100;
    timeAxis.ago2 = 0;
    clearInterval(resetTimer);
    render();
  }

  function updateTimerEvent() {
    if (update) {
      update = false;
      calculateStudies();
      setClipRegions();
      render();
    }
  }

  function scrollTimerEvent() {
    let now = Date.now();
    if (timeAxis.change) {
      let speed = Math.max(0.25, getXCount() / 500.0);
      scrollVelocity = Math.round(speed * (mouseScrollPosition[0] - scrollPosition[0]));
      scrollTime = now;
      scrollPosition = mouseScrollPosition;
      render();
    }
    else if (scrollVelocity) {
      let elapsed = now - scrollTime;
      let amount = scrollVelocity * Math.exp(-elapsed / 1000) + scrollOffset;
      if (Math.abs(amount) > 0.10) {
        let amount1 = Math.floor(amount);
        scrollOffset = amount - amount1;
        let amount2 = timeAxis.scroll ? amount1 : 0;
        changeTimeAxis(amount1, amount2);
        render();
      }
      else {
        clearInterval(scrollTimer);
      }
    }
    else {
      clearInterval(scrollTimer);
    }
  }

  function processMouseWheel(position)
  {
    timeAxis.change = true;
    timeAxis.scroll = (position[1]) < (0.90 * getChartHeight());
    let speed = getXCount() / 200.0;
    let amount1 = Math.round(speed * d3.event.wheelDeltaX);
    let amount2 = timeAxis.scroll ? amount1 : 0;
    changeTimeAxis(amount1, amount2);
    timeAxis.change = false;
  }

  function processMouseEnter() {
    timeAxis.change = false;
  }

  function getXCount() {
    return timeAxis.ago1 - timeAxis.ago2;
  }

  function getExtraCount() {
    let extra = Math.max(0, (minBars - 1) - timeAxis.ago2 - getCurrentBarAgo());
    return extra;
  }

  function getIndexRange() {
     let indexRange = [];
     indexRange[0] = Math.max(0, bars.length - timeAxis.ago1 + getExtraCount());
     indexRange[1] = Math.max(0, bars.length - timeAxis.ago2);
     return indexRange;
 }

  function getVisibleBars() {
    let ir = getIndexRange();
    return bars.slice(ir[0], ir[1]);
  }

  function getChartWidth() {
    return getChartDivWidth() - panels[0].priceAxis.width;
  }

  function getChartHeight() {
    return getChartDivHeight() - timeAxis.height;
  }

  function getChartDivWidth() {
    return document.getElementById(id + "-div").getBoundingClientRect().width;
  }

  function getChartDivHeight() {
    return document.getElementById(id + "-div").getBoundingClientRect().height;
  }

  function getXScale() {
    let xDomainMin = 0;
    let xDomainMax = 1;
    let xRangeMin = 0;
    let xRangeMax = (1.0 / getXCount()) * getChartWidth();
    return d3.scale.linear().domain([xDomainMin, xDomainMax]).range([xRangeMin, xRangeMax]);
  }

  function getPriceRange(number) {
     let range = [];
     range[0] = NaN;
     range[1] = NaN;
     if (number == 0) {
        let chartBars = getVisibleBars();
        range[0] = d3.min(chartBars, function (d) {return d.low;});
        range[1] = d3.max(chartBars, function (d) {return d.high;});
     }
     else {
        let panelCount = getPanelCount();
        if (number < panelCount && panels[number].visuals) {
          let visualCount = panels[number].visuals.length;
          let ir = getIndexRange();
          for (let ii = 0; ii < visualCount; ii++) {
            let v = panels[number].visuals[ii];
            if (v.type == "histogram") {
              let dataCount = v.data.length;
              let index1 = Math.max(0, ir[0] - v.index);
              let index2 = Math.min(dataCount, Math.max(0, ir[1] - v.index));
              let data = v.data.slice(index1, index2);
              range[0] = Math.min(v.base, d3.min(data));
              range[1] = Math.max(v.base, d3.max(data));
            }
          }
        }
     }
     return range;
  }

  function getYScale(number) {
    let r1 = getPanelRect(number);
    let xScale = getXScale();
    let margin = Math.min(16, Math.max(4, xScale(1.0)));
    let range = getPriceRange(number);
    let output = d3.scale.linear().domain([range[0], range[1]]).range([r1.bottom - margin, r1.top + margin]);
    return output;
  }

  function getChartDivRect(){
     let rect = {};
     rect.left = 0;
     rect.right = getChartDivWidth();
     rect.top = 0;
     rect.bottom = getChartDivHeight();
     return rect;
  }

  function getChartRect(){
     let rect = {};
     rect.left = 0;
     rect.right = getChartWidth();
     rect.top = 0;
     rect.bottom = getChartHeight();
     return rect;
  }

  function getPanelCount() {
    return (panels[1].visuals.length > 0) ? 2 : 1;
  }

  function getPanelRect(number) {
    let rect = {};

    let width = getChartWidth();
    let height = getChartHeight();

    let panelCount = getPanelCount();

    if (number == 0) {
      rect.left = 0;
      rect.right = width;
      rect.top = 0;
      rect.bottom = (panelCount == 1) ? height : 0.8 * height;
    }
    else if (number == 1) {
       rect.left = 0;
       rect.right = width;
       rect.top = 0.8 * height;
       rect.bottom = height;
    }
    return rect;
  }

  function getPanelHeight(number) {
    let rect = getPanelRect(number);
    return rect.bottom - rect.top;
  }

  function render() {

    renderTimeAxis();

    renderBars();

    for (let number = 0; number < 2; number++) {
      renderPriceAxis(number);
      renderVisuals(number);
    }

    renderCurrentPriceLabel();
    renderSymbolLabel();
    renderBorders();

    //renderDisclaimerLabel();
  }

  function getButtonHeight() {
    return 76;
  }

  function initializeSymbolLabels() {
    let x1 = 2;//getChartWidth() - 4;
    let y1 = 32;

    let editSymbol = (text1 != "");
    let collision = false;//labelCollision("symbolLabel");
    let level1 = collision? "0.05" : "0.25";
    let level2 = editSymbol ? 1.00 : level1;

    symbolLabel = [];
    let symbol = editSymbol ? text1 : chartSymbol;
    let fillColor = editSymbol ? "#FF2020" : "#404040";
    if (symbol != null && symbol.length > 0) {
      symbolLabel[0] = {x: x1, y: y1, opacity: level2, text: symbol, fill: fillColor, font_family: "sans-serif", font_size: 40};
      symbolLabel[1] = {x: x1 + 2, y: y1 + 12, opacity: level1, text: getChartIntervalText(chartInterval), fill: "#404040", font_family: "sans-serif", font_size: 12};
      if (chartInterval.session === 1) {
        symbolLabel[2] = {x: x1 + 2, y: y1 + 24, opacity: level1, text: "All Session", fill: "#404040", font_family: "sans-serif", font_size: 12};
      }
    }
  }

  function initializeDisclaimerLabel() {
    let collision = false;//labelCollision("disclaimerLabel");
    let level = collision? "0.05" : "0.25";

    disclaimerLabel = [];
    disclaimerLabel[0] = {x: getChartWidth() - 4, y: getChartHeight() - 4, opacity: level, text: "Data delayed 20 minutes", fill: "#404040", font_family: "sans-serif", font_size: 12};
  }

  function renderSymbolLabel() {

    initializeSymbolLabels();

    let svg = d3.select("#" + id);

     // enter
    svg
      .selectAll(".symbolLabel")
      .data(symbolLabel)
      .enter()
      .append("text")
      .attr("class", "symbolLabel");

    // update
    svg
      .selectAll(".symbolLabel")
      .data(symbolLabel)
      .text(function (d) {
        return d.text;
      })
      .style("font-family", function (d) {
        return d.font_family;
      })
      .style("font-size", function (d) {
        return d.font_size;
      })
      .style("fill", function (d) {
        return d.fill;
      })
      .attr("text-anchor", "start")
      .attr("stroke", "black")
      .attr("stroke-width", "1")
      .attr("opacity", function (d) {
        return d.opacity;
      })
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      });

    // exit
    svg
      .selectAll(".symbolLabel")
      .data(symbolLabel)
      .exit()
      .remove();
  }

  function renderDisclaimerLabel() {

    let svg = d3.select("#" + id);

     // enter
    svg
      .selectAll(".disclaimerLabel")
      .data(disclaimerLabel)
      .enter()
      .append("text")
      .attr("class", "disclaimerLabel");

    // update
    svg
      .selectAll(".disclaimerLabel")
      .data(disclaimerLabel)
      .text(function (d) {
        return d.text;
      })
      .style("font-family", function (d) {
        return d.font_family;
      })
      .style("font-size", function (d) {
        return d.font_size;
      })
      .style("fill", function (d) {
        return d.fill;
      })
      .attr("text-anchor", "end")
      .attr("stroke", "black")
      .attr("stroke-width", "1")
      .attr("opacity", function (d) {
        return d.opacity;
      })
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      });

    // exit
    svg
      .selectAll(".disclaimerLabel")
      .data(disclaimerLabel)
      .exit()
      .remove();
  }

  function renderCurrentPriceLabel() {

    let ago = getCurrentBarAgo();
    let index = bars.length - ago - 1;

    if (getExtraCount() > 0 && index >= 0 && bars[index]) {

      let close = bars[index].close;

      let xScale = getXScale();
      let yScale = getYScale(0);

      let x1 = Math.round(xScale(getXCount() - (ago - timeAxis.ago2 + getExtraCount()) + 0.050));
      let y1 = yScale(close) + xScale(0.4);

      let fontSize = Math.floor(xScale(1.35)).toString();

      let digits = 2;
      if (close < 0.002) digits = 7;
      else if (close < 0.02) digits = 6;
      else if (close < 0.2) digits = 5;
      else if (close < 2) digits = 4;

      let label = close.toFixed(digits);

      currentPriceLabel[0] = {x: x1, y: y1, text: label, fill: "black", font_family: "sans-serif", font_size: fontSize};
    }
    else {
      currentPriceLabel = [];
    }

    let svg = d3.select("#" + id);

     // enter
    svg
      .selectAll(".currentPriceLabel")
      .data(currentPriceLabel)
      .enter()
      .append("text")
      .attr("class", "currentPriceLabel");

    // update
    svg
      .selectAll(".currentPriceLabel")
      .attr("clip-path", "url(#clip1)")
      .data(currentPriceLabel)
      .text(function (d) {
        return d.text;
      })
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      })
      .style("font-family", function (d) {
        return d.font_family;
      })
      .style("font-size", function (d) {
        return d.font_size;
      })
      .attr("fill", function (d) {
        return d.fill;
      });

    // exit
    svg
      .selectAll(".currentPriceLabel")
      .data(currentPriceLabel)
      .exit()
      .remove();
  }

  function renderTimeAxis() {
    if (timeAxis.update) {
      timeAxis.update = false;
      updateTimeAxis();
      let className = "xScaleLabel";
      let labels = timeAxis.labels;
      renderText(className, labels);
    }
  }

  function renderPriceAxis(number) {
    if (panels[number].priceAxis.update) {
      panels[number].priceAxis.update = false;
      updatePriceAxis(number);
      let className = "yScaleLabel" + number.toString();
      let labels = panels[number].priceAxis.labels;
      renderText(className, labels);
    }
  }

  function renderText(className, labels)
  {
    let selector = "." + className;

    let svg = d3.select("#" + id);

    // enter
    svg
      .selectAll(selector)
      .data(labels)
      .enter()
      .append("text")
      .attr("class", className);

    // update
    svg
      .selectAll(selector)
      .data(labels)
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      })
      .attr("text-anchor", function (d) {
        return d.anchor;
      })
      .text(function (d) {
        return d.text;
      });

    // exit
    svg
      .selectAll(selector)
      .data(labels)
      .exit()
      .remove();
  }

  function getChartDivBorderLines() {
    let r = getChartDivRect();
    let lines = [
      {x1: r.left, y1: r.top, x2: r.right, y2: r.top, stroke: "black", stroke_width: 0.5},
      {x1: r.right - 0.5, y1: r.top, x2: r.right - 0.5, y2: r.bottom, stroke: "black", stroke_width: 0.5},
      {x1: r.left, y1: r.bottom, x2: r.right, y2: r.bottom, stroke: "black", stroke_width: 0.5},
      {x1: r.left, y1: r.top, x2:r.left, y2: r.bottom, stroke: "black", stroke_width: 0.5}];
    return lines;
  }

  function getPanelBorderLines(number) {
    let r = getPanelRect(number);
    let lines = [
     {x1: r.right, y1: r.top, x2: r.right, y2: r.bottom, stroke: "black", stroke_width: 0.5},
     {x1: r.left, y1: r.bottom, x2: r.right, y2: r.bottom, stroke: "black", stroke_width: 0.5}];
   return lines;
  }

  function getButtons() {
      let buttons = [];
      let panelCount = getPanelCount();
      for (let number = 0; number < panelCount; number++) {
        if (panels[number].visuals) {
           for (let ii = 0; ii < panels[number].visuals.length; ii++) {
            let v = panels[number].visuals[ii];
            if (v.type == "button") {
              let button1 = {};
              button1.x = v.index;
              button1.y = v.value;
              button1.r = 40;
              buttons.push(button1);
            }
          }
        }
      }
      return buttons;
    }


  function getCircles(number) {
    let circles = [];
    if (panels[number].visuals) {
      let xOffset = bars.length - timeAxis.ago1 + getExtraCount() - 0.5;
      let x = getXScale();
      let y = getYScale(number);
      for (let ii = 0; ii < panels[number].visuals.length; ii++) {
        let v = panels[number].visuals[ii];
        if (v.type == "button") {
          let y1 = y(v.value);
          if (!isNaN(y1)) {
            let circle1 = {};
            circle1.cx = x(v.index - xOffset);
            circle1.cy = y(v.value);
            circle1.r = 38;
            circles.push(circle1);
          }
        }
      }
    }
    return circles;
  }

  function renderCircles(number, circles) {

    let className = "circle" + number.toString();
    let selector = "." + className;
    let clipName = "url(#clip" + (number + 1).toString() + ")";

    let svg = d3.select("#" + id);

    // enter
    svg
      .selectAll(selector)
      .data(circles)
      .enter()
      .append("circle")
      .attr("class", className);

    // update
    svg
      .selectAll(selector)
      .data(circles)
      .attr("cx", function (d) { return d.cx; })
      .attr("cy", function (d) { return d.cy; })
      .attr("r", function (d) { return d.r; })
      .attr("stroke", "black")
      .attr("fill", "black")
      .attr("opacity", 0.05)
      .attr("stroke-width", 0.5);

   // exit
    svg
      .selectAll(selector)
      .data(circles)
      .exit()
      .remove();
  }

  function getLines(number) {
    let lines = [];
    if (panels[number].visuals) {
      let xOffset = bars.length - timeAxis.ago1 + getExtraCount() - 0.5;
      let x = getXScale();
      let y = getYScale(number);
      for (let ii = 0; ii < panels[number].visuals.length; ii++) {
        let v = panels[number].visuals[ii];
        if (v.type == "line") {
          let y1 = y(v.value1);
          let y2 = y(v.value2);
          if (!isNaN(y1) && !isNaN(y2)) {
            let line = {stroke: v.color, stroke_width: x(v.thickness)};
            line.x1 = x(v.index1 - xOffset);
            line.x2 = x(v.index2 - xOffset);
            line.y1 = y1;
            line.y2 = y2;
            lines.push(line);
          }
        }
        else if (v.type == "histogram") {
          let count = v.data.length;
          let index1 = v.index;
          let y1 = y(v.base);
          if (!isNaN(y1)) {
            for (let ii = 0; ii < count; ii++) {
              let y2 = y(v.data[ii]);
              if (!isNaN(y2)) {
                let index = index1 + ii;
                let line = {stroke: v.color, stroke_width: x(v.thickness)};
                line.x1 = x(index - xOffset);
                line.x2 = line.x1
                line.y1 = y1;
                line.y2 = y2;
                lines.push(line);
              }
            }
          }
        }
      }
    }
    return lines;
  }

  function getAnnotations(number) {
    //let annotations = [{x: 100, y: 100, text: "Hello World!", fill: "red", font_family: "sans-serif", font_size: "50px"}];
    let annotations = [];
    if (panels[number].visuals) {
      let xOffset = bars.length - timeAxis.ago1 + getExtraCount() - 0.5;
      let x = getXScale();
      let y = getYScale(number);
      let size = Math.max(8, x(1));
      for (let ii = 0; ii < panels[number].visuals.length; ii++) {
        let v = panels[number].visuals[ii];
        if (v.type == "annotation") {
          let y1 = y(v.value) + ((v.position == "below") ? 0.85 * size : -0.15 * size);
          if (!isNaN(y1)) {
            let annotation = {};
            annotation.x = x(v.index - xOffset);
            annotation.y = y1;
            annotation.text = (v.style == "up arrow") ? "\u25B2" : "\u25BC";
            annotation.fill = v.color;
            annotation.font_family = "sans-serif";
            annotation.font_size = size.toString() + "px";
            annotation.text_anchor = "middle";
            annotations.push(annotation);
          }
        }
      }
    }
    return annotations;
  }

  function renderBorders() {
    let lines = getChartDivBorderLines();
    let panelCount = getPanelCount();
    for (let ii = 0; ii < panelCount; ii++) {
      lines = lines.concat(getPanelBorderLines(ii));
    }

    let className = "border";
    let selector = "." + className;

    let svg = d3.select("#" + id);

    // enter
    svg
      .selectAll(selector)
      .data(lines)
      .enter()
      .append("line")
      .attr("class", className);

    // update
    svg
      .selectAll(selector)
      .data(lines)
      .attr("x1", function (d) {
        return d.x1;
      })
      .attr("x2", function (d) {
        return d.x2;
      })
      .attr("y1", function (d) {
        return d.y1;
      })
      .attr("y2", function (d) {
        return d.y2;
      })
      .attr("stroke", function (d) {
        return d.stroke;
      })
      .attr("stroke-width", function (d) {
        return d.stroke_width;
      });

    // exit
    svg
      .selectAll(selector)
      .data(lines)
      .exit()
      .remove();
  }

  function renderVisuals(number) {
    let lines = getLines(number);
    renderLines(number, lines);
    let circles = getCircles(number);
    renderCircles(number, circles);
    let annotations  = getAnnotations(number);
    renderAnnotations(number, annotations);
  }

  function renderLines(number, lines) {
    let className = "line" + number.toString();
    let selector = "." + className;
    let clipName = "url(#clip" + (number + 1).toString() + ")";

    let svg = d3.select("#" + id);

    // enter
    svg
      .selectAll(selector)
      .data(lines)
      .enter()
      .append("line")
      .attr("class", className);

    // update
    svg
      .selectAll(selector)
      .attr("clip-path", clipName)
      .data(lines)
      .attr("x1", function (d) {
        return d.x1;
      })
      .attr("x2", function (d) {
        return d.x2;
      })
      .attr("y1", function (d) {
        return d.y1;
      })
      .attr("y2", function (d) {
        return d.y2;
      })
      .attr("stroke", function (d) {
        return d.stroke;
      })
      .attr("stroke-width", function (d) {
        return d.stroke_width;
      })
      .attr("stroke-linecap", "butt");

    // exit
    svg
      .selectAll(selector)
      .data(lines)
      .exit()
      .remove();
  }

  function renderAnnotations(number, annotations) {
    let className = "Annotations" + number.toString();
    let selector = "." + className;
    let clipName = "url(#clip" + (number + 1).toString() + ")";

    let svg = d3.select("#" + id);

    // enter
    svg
      .selectAll(selector)
      .data(annotations)
      .enter()
      .append("text")
      .attr("class", className);

    // update
    svg
      .selectAll(selector)
      .attr("clip-path", clipName)
      .data(annotations)
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      })
      .text(function (d) {
        return d.text;
      })
      .style("font-family", function (d) {
        return d.font_family;
      })
      .style("text-anchor", function (d) {
        return d.text_anchor;
      })
      .style("font-size", function (d) {
        return d.font_size;
      })
      .style("fill", function (d) {
        return d.fill;
      });

    // exit
    svg
      .selectAll(selector)
      .data(annotations)
      .exit()
      .remove();
  }

  function initializePanels() {
    panels = [];
    initializePanel(0);
    initializePanel(1);
  }

  function initializePanel(number) {
    panels[number] = {};
    panels[number].priceAxis = {};
    panels[number].priceAxis.update = true;
    panels[number].priceAxis.width = 44;
    panels[number].priceAxis.labels = [];
    panels[number].visuals = [];
  }

  function calculateStudies() {

    initializePanels();

    calculateBarColors();
 
    if (studies && studies.length > 0) {

      let study = new Study();

      let output = [];

      if (studies.includes("QLRx")) {
        let input1 = {};
        input1.bars = bars;
        input1.currentIndex = bars.length - getCurrentBarAgo() - 1;
        input1.period = QLRxPeriod;
        input1.factor = 1.0;
        input1.filter = 1.0;
        output.push(study.calculateQLRx(input1));
      }

      if (studies.includes("MQL1")) {
        let input2 = {};
        input2.bars = bars;
        input2.currentIndex = bars.length - getCurrentBarAgo() - 1;
        input2.period = 500;
        output.push(study.calculateMQL1(input2));
      }

      for (let outputNumber = 0; outputNumber < output.length; outputNumber++) {
        for (let panelNumber = 0; panelNumber < output[outputNumber].panels.length; panelNumber++) {
          panels[panelNumber].visuals = panels[panelNumber].visuals.concat(output[outputNumber].panels[panelNumber].visuals);
        }
      }
    }

    buttons = getButtons();
  }

  function calculateBarColors() {
    barColors = [];
    if (bars.length > 0) {
      let ii = 0;
      let hi = bars[0].high;
      let lo = bars[0].low;
      barColors[0] = 0;
      for (let ii = 1; ii < bars.length; ii++) {
        let hi0 = bars[ii].high;
        let lo0 = bars[ii].low;
        let cl1 = bars[ii - 1].close;
        let th0 = isNaN(cl1) ? hi0 : (isNaN(hi0) ? cl1 : Math.max(hi0, cl1));
        let tl0 = isNaN(cl1) ? lo0 : (isNaN(lo0) ? cl1 : Math.min(lo0, cl1));
        let up = !isNaN(th0) && (isNaN(hi) || th0 > hi);
        let dn = !isNaN(tl0) && (isNaN(lo) || tl0 < lo);
        hi = (up || dn) ? th0 : hi;
        lo = (dn || up) ? tl0 : lo;
        barColors[ii] = (up && dn) ? 3  : (up ? 2 : (dn ? 1 : 0));
      }
    }
  }

  function getBarColor(index) {
    let color = "black";
    let mqs1 = studies && studies.includes("MQS1");
    if (mqs1) {
      let bc = (0 <= index && index < barColors.length) ? barColors[index] : 0;
      color = (bc === 3) ? "goldenrod" : ((bc === 2) ? "blue" : ((bc === 1) ? "red" : "black"));
    }
    return color;
  }

  function renderBars() {

    let xScale = getXScale();
    let yScale = getYScale(0);

    let chartBars = getVisibleBars();

    let barCount = chartBars.length;
    let slotCount = getXCount();
    let xOffset = ((barCount < slotCount) ? slotCount - barCount : 0) - getExtraCount();

    let line = studies ? studies.includes("Line") : null;

    let svg = d3.select("#" + id);

    // enter
    svg
      .selectAll(".bar")
      .data(chartBars)
      .enter()
      .append("path")
      .attr("class", "bar");

    // update
    svg
      .selectAll(".bar")
      .attr("clip-path", "url(#clip1)")
      .data(chartBars)
      .attr("d", function (d, i) {

        if (line) {
          if (i > 0) {
            let x1 = Math.round(xScale(i + xOffset - 0.500));
            let x2 = Math.round(xScale(i + xOffset + 0.500));
            let y1 = yScale(chartBars[i - 1].close)
            let y2 = yScale(d.close);
            return !barOk(d) ? " M 0 0" :
              " M " + x1 + " " + y1 +
              " L " + x2 + " " + y2;
          }
        }
        else {
          let x1 = Math.round(xScale(i + xOffset + 0.050));
          let x3 = Math.round(xScale(i + xOffset + 0.500));
          let x5 = Math.round(xScale(i + xOffset + 0.950));

          let halfBarWidth = 0.5 * xScale(barWidth);

          let x2 = x3 - halfBarWidth;
          let x4 = x3 + halfBarWidth;

          let y1 = yScale(d.open);
          let y2 = yScale(d.high);
          let y3 = yScale(d.low);
          let y4 = yScale(d.close);

          return !barOk(d) ? " M 0 0" :
          " M " + x3 + " " + y2 +
          " L " + x3 + " " + y3 +
          " M " + x1 + " " + y1 +
          " L " + x4 + " " + y1 +
          " M " + x2 + " " + y4 +
          " L " + x5 + " " + y4;
        }
      })
      .attr("stroke", function (d, i) { return getBarColor(i + Math.max(0, bars.length - timeAxis.ago1 + getExtraCount())); })
      .attr("stroke-width", Math.max(0.25, xScale(barWidth)));

    // exit
    svg
      .selectAll(".bar")
      .data(chartBars)
      .exit()
      .remove();
  }

  function barOk(bar) {
    return !(isNaN(bar.open) || isNaN(bar.high) || isNaN(bar.low) || isNaN(bar.close));
  }

  /*
  function getTrade() {
    let trade = Math.round(price);
    price += 2 * (Math.random() - 0.5);
    return trade;
  }

  function addBar(time) {
    bars.push(new Bar(time, NaN, NaN, NaN, NaN));
  }

  function updateBar(index, trade) {
    if (isNaN(bars[index].open)) {
      bars[index].open = trade;
      bars[index].high = trade;
      bars[index].low = trade;
    }
    else {
      if (trade > bars[index].high) {
        bars[index].high = trade;
      }
      if (trade < bars[index].low) {
        bars[index].low = trade;
      }
    }
    bars[index].close = trade;
  }

  function removeBar() {
    bars.shift();
  }
*/

   // positive left and negative right
  function changeTimeAxis(amount1, amount2) {
    if (amount1 !== 0 || amount2 !== 0) {

      let maxCnt = getMaxBars(chartInterval.symbol);

      let ago1 = timeAxis.ago1 + amount1;
      let ago2 = timeAxis.ago2 + amount2;
      let count = Math.min(maxCnt, Math.max(minBars, ago1 - ago2));

      if (ago1 - ago2 < count || ago1 - ago2 > count) {
        ago1 = ago2 + count;
      }

      if (ago1 > maxCnt) {
        ago1 = maxCnt;
        ago2 = maxCnt - count;
      }

      if (ago2 < 0) {
        ago1 = count;
        ago2 = 0;
      }

      if (ago1 !== timeAxis.ago1 || ago2 !== timeAxis.ago2) {

        timeAxis.ago1 = ago1;
        timeAxis.ago2 = ago2;

        timeAxis.update = true;
        for (let number = 0; number < 2; number++) {
          panels[number].priceAxis.update = true;
        }

        let barCount = ago1 - ago2 + 1;
        if (!isNaN(barCount)) {
          PubSub.publish('BARCOUNT', barCount.toString());
        }
      }
    }
  }

   function labelCollision(name) {
    let collision = false;

    let svg = d3.select("#" + id);

    let bars = svg.selectAll(".bar")[0].concat(svg.selectAll(".currentPriceLabel")[0]);
    let labels = svg.selectAll("." + name)[0];

    for (let ii = 0; ii < labels.length; ii++) {
      let a = labels[ii].getBoundingClientRect();
      for (let jj = bars.length - 1; jj >= 0; jj--) {
        let b = bars[jj].getBoundingClientRect();
        if(rectangleOverlap(a, b)) {
          collision = true;
          break;
        }
      }
    }
    return collision;
  }

  function rectangleOverlap(a, b) {
    let overlap = 4;
    if (a.left + overlap > b.right || b.left + overlap > a.right) {
      return false;
    }
    if (a.top + overlap > b.bottom || b.top + overlap > a.bottom) {
      return false;
    }
    return true;
  }

  function getTextWidth(input) {
	
		let text = document.createElement("span");
		document.body.appendChild(text);
		text.style.height = 'auto';
		text.style.width = 'auto';
		text.style.position = 'absolute';
		text.style.whiteSpace = 'no-wrap';
		text.innerHTML = input;
		let width = Math.ceil(text.clientWidth);
		document.body.removeChild(text);
    return width;
	}

  function getTimeAxisInfo() {

    let info = [];

    let xScale = getXScale();

    let found = false;

    let ii = 0;

    let index = 0;

    let pixel = 0;
    let minute = 0;
    let time = null;
    let prvTime = null;
    let collisionDistance = 0;
    let tsi = null;

    let chartBars = getVisibleBars();

    let barCount = chartBars.length;
    let slotCount = getXCount();
    let xOffset = ((barCount < slotCount) ? slotCount - barCount : 0) - getExtraCount() + 0.5;

    let firstPrvIndex = bars.length - timeAxis.ago1 - 1;
    let firstPrvTime = (firstPrvIndex >= 0) ? bars[firstPrvIndex].getDateTime() : null;
    let prvPixel = Math.round(xScale(-1 + xOffset));
    let prvMinute = (firstPrvTime != null) ? firstPrvTime.minute() + 60 * firstPrvTime.hour() : 0;

    let index1 = 0;
    let index2 = barCount;

    let intervalDuration = moment.duration(chartInterval.amount, chartInterval.unit);

    let pixels = [];
    let times = [];
    for (let idx = 0; idx < barCount; idx++) {
      pixels.push(Math.round(xScale(idx + xOffset)));
      times.push(chartBars[idx].getDateTime());
    }

    // h:mm
    let duration = moment.duration(30, 'minute');
    if (intervalDuration <= duration) {
      let interval1 = [5, 10, 15, 20, 30, 60, 120, 240, 360];
      let interval2 = [1, 5, 5, 5, 10, 15, 30, 30, 60];
      let collisionDistance1 = textWidth1 + 8;
      let collisionDistance2 = textWidth1 + 12;
      for (let ii = 0; ii < interval1.length && !found; ii++) {
        info = [];
        prvTime = firstPrvTime;
        prvPixel = Number.NaN;
        let prvDayChange = false;
        for (index = index1; index < index2; index++) {
          tsi = {};
          tsi.type = 0;
          tsi.level = 0;
          time = times[index];
          pixel = pixels[index];
          tsi.pixel = pixel;
          if (time != null && prvTime != null) {
            tsi.time = time;
            minute = time.minute() + 60 * time.hour();
            prvMinute = prvTime.minute() + 60 * prvTime.hour();
            if (time.date() !== prvTime.date() || (minute % interval1[ii]) <= (prvMinute % interval1[ii])) {
              found = true;
              if (!(prvDayChange && Math.abs(pixel - prvPixel) < collisionDistance1)) {
                tsi.type = 1;
                tsi.level = 1;
                if (!isNaN(prvPixel)) {
                  if (Math.abs(pixel - prvPixel) < collisionDistance2) {
                    found = false;
                    break;
                  }
                }
                prvPixel = pixel;
              }
              prvDayChange = (time.date() !== prvTime.date());
            }
            if (tsi.level === 0 && (minute % interval2[ii]) <= (prvMinute % interval2[ii])) {
              tsi.level = 2;
            }
          }
          prvTime = time;
          info.push(tsi);
        }
      }
    }

    // MM/DD every day
    if (!found) {
      info = [];
      prvTime = firstPrvTime;
      prvPixel = Number.NaN;
      collisionDistance = textWidth2 + 12;
      for (index = index1; index < index2; index++) {
        tsi = {};
        tsi.type = 0;
        tsi.level = 0;
        time = times[index];
        pixel = pixels[index];
        tsi.pixel = pixel;
        if (time != null && prvTime != null) {
          tsi.time = time;
          if (prvTime.date() !== time.date()) {
            found = true;
            tsi.type = 2;
            tsi.level = 1;
            if (!isNaN(prvPixel)) {
              if (Math.abs(pixel - prvPixel) < collisionDistance) {
                found = false;
                break;
              }
            }
            prvPixel = pixel;
          }
          minute = time.minute() + 60 * time.hour();
          if (tsi.level === 0 && minute % 60 === 0) {
            tsi.level = 2;
          }
        }
        prvTime = time;
        info.push(tsi);
      }
    }

    // MM/DD every week
    if (!found) {
      info = [];
      prvTime = firstPrvTime;
      prvPixel = Number.NaN;
      collisionDistance = textWidth2 + 12;
      for (index = index1; index < index2; index++) {
        tsi = {};
        tsi.type = 0;
        tsi.level = 0;
        time = times[index];
        pixel = pixels[index];
        tsi.pixel = pixel;
        if (time != null && prvTime != null) {
          tsi.time = time;
          if (prvTime.day() > time.day()) {
            found = true;
            tsi.type = 2;
            tsi.level = 1;
            if (!isNaN(prvPixel)) {
              if (Math.abs(pixel - prvPixel) < collisionDistance) {
                found = false;
                break;
              }
            }
            prvPixel = pixel;
          }
          if (tsi.level === 0 && prvTime.date() !== time.date()) {
            tsi.level = 2;
          }
        }
        prvTime = time;
        info.push(tsi);
      }
    }

    // MMM YYYY
    if (!found) {
      let interval3 = [1, 2, 3];
      collisionDistance = textWidth3 + 12;
      for (let ii = 0; ii < 3 && !found; ii++) {
        info = [];
        prvTime = firstPrvTime;
        prvPixel = Number.NaN;
        for (index = index1; index < index2; index++) {
          tsi = {};
          tsi.type = 0;
          tsi.level = 0;
          time = times[index];
          pixel = pixels[index];
          tsi.pixel = pixel;
          if (time != null && prvTime != null) {
            tsi.time = time;
            if (prvTime.month() !== time.month()) {
              let month = time.month();
              if ((month % interval3[ii]) === 0) {
                found = true;
                tsi.type = 3;
                tsi.level = 1;
                if (!isNaN(prvPixel)) {
                  if (Math.abs(pixel - prvPixel) < collisionDistance) {
                    found = false;
                    break;
                  }
                }
                prvPixel = pixel;
              }
            }
            if (tsi.level === 0 && ((ii === 0 && prvTime.date() > time.date()) || (ii > 0 && prvTime.month() !== time.month()))) {
              tsi.level = 2;
            }
          }
          prvTime = time;
          info.push(tsi);
        }
      }
    }

    // YYYY
    if (!found) {
      let yearInterval = [1, 2, 4, 5, 10, 20, 25, 50, 100];
      collisionDistance = textWidth4 + 12;
      for (let ii = 0; ii < 9 && !found; ii++) {
        info = [];
        prvTime = firstPrvTime;
        prvPixel = Number.NaN;
        for (index = index1; index < index2; index++) {
          tsi = {};
          tsi.type = 0;
          tsi.level = 0;
          time = times[index];
          pixel = pixels[index];
          tsi.pixel = pixel;
          if (time != null && prvTime != null) {
            tsi.time = time;
            if (prvTime.year() !== time.year()) {
              let year = time.year();
              if (year % yearInterval[ii] === 0) {
                found = true;
                tsi.type = 4;
                tsi.level = 1;
                if (!isNaN(prvPixel)) {
                  if (Math.abs(pixel - prvPixel) < collisionDistance) {
                    found = false;
                    break;
                  }
                }
                prvPixel = pixel;
              }
            }
            if (tsi.level === 0 && prvTime.month() !== time.month()) {
              tsi.level = 2;
            }
          }
          prvTime = time;
          info.push(tsi);
        }
      }
    }
    return info;
  }

  function updateTimeAxis() {

    timeAxis.labels.length = 0;

    let chartWidth = getChartWidth();
    let chartHeight = getChartHeight();

    let x1 = 0;
    let x2 = chartWidth - panels[0].priceAxis.width;
    let y1 = chartHeight + timeAxis.height - 2;
    //let y2 = chartHeight;

    let formats = ["", "h:mm", "MM-DD", "MMM YYYY", "YYYY"];

    let timeAxisInfo = getTimeAxisInfo();

    let count = timeAxisInfo.length;
    for (let ii = 0; ii < count; ii++) {
      if (timeAxisInfo[ii].level === 1) {
        let xx = timeAxisInfo[ii].pixel;

        if (x1 < xx && xx < x2) {

          let fidx = timeAxisInfo[ii].type;
          let time = timeAxisInfo[ii].time;
          let format = formats[fidx];

          let label = {};
          label.x = xx + 4;
          label.y = y1;
          label.anchor = "start";
          label.text = (fidx === 1) ? moment(time.toDate()).format(format) : time.format(format);

          //console.log (time.toString() + " " + format);

          timeAxis.labels.push(label);

        }
      }
    }
  }

  function getPriceAxisInfo(number) {

    let info = [];

    let yScale = getYScale(number);

    let r = getPanelRect(number);

    let panelHeight = r.bottom - r.top;
    let fontHeight = 13;

    let y1 = r.top;
    let y2 = r.bottom;

    let domain = yScale.domain();

    let minValue = domain[0];
    let maxValue = domain[1];

    let binaryScale = false;
    //let tickSize = 0.01;

    let log10 = 1 / Math.log(10);

    let reverse = (maxValue < minValue);
    let round = 1.0;
    if (binaryScale) {
      round = 1.0 / 32;
    }
    else {
      let logBaseValue = Math.round((minValue !== 0.0) ? log10 * Math.log(Math.abs(minValue)) - 1.5 : 0);
      if (logBaseValue > 0) {
        logBaseValue = 0;
      }
      round = Math.pow(10.0, logBaseValue);
    }
    let delta = maxValue - minValue;
    delta = Math.abs(delta);

    let count = 0;
    let prvInc = 0;
    let found = false;
    let maxCount = Math.round(Math.max(4, panelHeight / (8 * fontHeight)));
    let minCount = 4;

    let inc = 1.0;
    if (binaryScale) {
      found = false;
      prvInc = 1.0 / 2048;
      for (inc = 1.0 / 1024; inc < 1e20 && !found; inc *= 2) {
        count = Math.abs(delta) / inc;
        if (count < minCount) {
          inc = prvInc;
          found = true;
          break;
        }
        if (count < maxCount) {
          found = true;
          break;
        }
        prvInc = inc;
      }
    }
    else {
      found = false;
      inc = 0.01;
      let inc2 = [0.010, 0.020, 0.025, 0.050];
      for (let inc1 = 0.0000001; inc1 < 1e20 && !found; inc1 *= 10) {
        for (let ii = 0; ii < 4; ii++) {
          if (!(inc1 === 1.0 && inc2[ii] === 0.025)) {
            prvInc = inc;
            inc = inc1 * inc2[ii];
            count = Math.abs(delta) / inc;
            if (count < minCount) {
              inc = prvInc;
              found = true;
              break;
            }
            if (count < maxCount) {
              found = true;
              break;
            }
          }
        }
      }
    }

    let scale = 1.0;
    let label = ' ';
    let digits = 2;

    if (inc > 1e15) {
      scale = 0;
      digits = 0;
      label = ' ';
    }
    else if (inc >= 2e11) {
      scale = 1e12;
      digits = ((inc % 1e12) === 0) ? 0 : ((inc % 1e11) === 0) ? 1 : 2;
      label = 'T';
    }
    else if (inc >= 2e8) {
      scale = 1e9;
      digits = ((inc % 1e9) === 0) ? 0 : ((inc % 1e8) === 0) ? 1 : 2;
      label = 'B';
    }
    else if (inc >= 2e5) {
      scale = 1e6;
      digits = ((inc % 1e6) === 0) ? 0 : ((inc % 1e5) === 0) ? 1 : 2;
      label = 'M';
    }
    else if (inc >= 2e3) {
      scale = 1e3;
      digits = ((inc % 1e3) === 0) ? 0 : ((inc % 1e2) === 0) ? 1 : 2;
      label = 'K';
    }
    else {
      digits = Math.round(log10 * -Math.log(inc) + 1.5);
      if (digits < 0) {
        digits = 0;
      }
    }

    let value = reverse ? maxValue : minValue;
    value -= ((value % inc) + 2 * inc);

    inc *= (binaryScale ? 0.125 : 0.1);
    let rr = Math.pow(10, digits);

    for (let counter = 0; (reverse ? value > maxValue : value < maxValue) && counter < 1000;) {
      for (let jj = 0; jj < (binaryScale ? 8 : 10) && counter < 1000; jj++, counter++) {
        let pixel = yScale(value);
        if (y1 <= pixel && pixel < y2) {
          let vsi = {};
          vsi.level = (jj === 0) ? 1 : ((jj === (binaryScale ? 4 : 5)) ? 2 : 3);
          vsi.value = Math.round(value * rr) / rr;
          vsi.scale = scale;
          vsi.digits = digits;
          vsi.label = label;
          vsi.pixel = pixel;
          info.push(vsi);
        }
        value += inc;
      }
    }
    return info;
  }

  function updatePriceAxis(number) {

    panels[number].priceAxis.labels = [];

    let r = getPanelRect(number);

    let chartWidth = getChartWidth();
    let chartHeight = getChartHeight();

    let y1 = r.top;
    let x2 = r.right + panels[number].priceAxis.width - 3;
    let y2 = r.bottom;

    let priceAxisInfo = getPriceAxisInfo(number);
    let count = priceAxisInfo.length;

    let maxCount = 0;
    for (let ii = 0; ii < count; ii++) {
      if (priceAxisInfo[ii].level === 1) {
        let yy = priceAxisInfo[ii].pixel;
        let text = priceAxisInfo[ii].value.toString();
        if (y1 < yy && yy < y2 && text.length <= 6) {
          let pieces = text.split(".");
          let decimalCount = (pieces.length === 2)? pieces[1].length : 0;
          maxCount = Math.max(decimalCount, maxCount);
        }
      }
    }

    for (let ii = 0; ii < count; ii++) {
      if (priceAxisInfo[ii].level === 1) {
        let yy = priceAxisInfo[ii].pixel;
        let text = priceAxisInfo[ii].value.toFixed(maxCount);

        if (y1 < yy && yy < y2 && text.length <= 6) {

          let label = {};
          label.x = x2;
          label.y = priceAxisInfo[ii].pixel;
          label.anchor = "end";
          label.text = text;

          panels[number].priceAxis.labels.push(label);
        }
      }
    }
  }
}

