
function Study() {

  // input.bars = MLR input bars
  // input.period = MLR period
  // input.factor = MLR channel width factor
  // input.filter = MLR direction change filter
  this.calculateQLRx = function(input) {

    let output = {};
    output.panels = [];

    let count = input.bars.length;
    if (count >= input.period) {

      output.panels[0] = {};
      output.panels[1] = {};
      output.panels[0].visuals = [];
      output.panels[1].visuals = [];

      let data = [];
      let count = input.bars.length;
      let index1 = count - 1 - input.period;
      let index2 = Math.min(input.currentIndex, count - 1);
      for (let ii = 0; ii < input.period; ii++) {
        let index = index1 + ii;
        data.push((input.bars[index].high + input.bars[index].low) / 2);
      }

      let slope = [];
      let intercept;
      let slope0 = NaN;
      let slope1 = NaN;
      let slope2 = NaN;
      let direction = 0;
      let minSlope = NaN;
      let maxSlope = NaN;

      let size = data.length;
      for (let cnt = 1; cnt <= size; cnt++)
      {
        let index = index1 + cnt - 1;

        let sumX = 0;
        let sumY = 0;
        let sumXX = 0;
        let sumXY = 0;

        let n = 0;
        for (let ii = 0; ii < cnt; ii++) {
          let x = ii;
          let y = data[ii];

          if (!isNaN(y)) {
              sumX += x;
              sumY += y;
              sumXX += (x * x);
              sumXY += (x * y);
              n++;
          }
        }

        let value = ((n * sumXX) - (sumX * sumX));
        slope0 = (value != 0) ? ((n * sumXY) - (sumX * sumY)) / value : Number.NaN;
        intercept = (sumY - (slope0 * sumX)) / n;

        slope.push(slope0);

        if (!isNaN(slope0) && !isNaN(slope1) && !isNaN(slope2)) {
          if (direction <= 0) {
            let turnUp = (slope0 >= slope1 && slope1 < slope2);
            if (turnUp && (isNaN(minSlope) || slope0 < minSlope)) {
              minSlope = slope0;
            }
          }
          if (direction >= 0) {
            let turnDn = (slope0 <= slope1 && slope1 > slope2);
            if (turnDn && (isNaN(maxSlope) || slope0 > maxSlope)) {
              maxSlope = slope0;
            }
          }
        }

        if (!isNaN(slope0) && !isNaN(minSlope) && slope0 >= ((1.0 + input.filter / 100.0) * minSlope)) {
          minSlope = NaN;
          direction = 1;

          let annotation = {};
          annotation.type = "annotation";
          annotation.style = "up arrow";
          annotation.index = index;
          annotation.value = slope0;
          annotation.position = (slope0 >= 0) ? "above" : "below";
          annotation.color = "blue";
          output.panels[1].visuals.push(annotation);
        }

        if (!isNaN(slope0) && !isNaN(maxSlope) && slope0 <= ((1.0 - input.filter / 100.0) * maxSlope)) {
          maxSlope = NaN;
          direction = -1;

          let annotation = {};
          annotation.type = "annotation";
          annotation.style = "down arrow";
          annotation.index = index;
          annotation.value = slope0;
          annotation.position = (slope0 >= 0) ? "above" : "below";
          annotation.color = "red";
          output.panels[1].visuals.push(annotation);
        }

        slope2 = slope1;
        slope1 = slope0;
      }

      let sumOfSquares = 0;
      let m = 0;
      for (let ii = 0; ii < size; ii++)
      {
        let y1 = intercept + (slope[size - 1] * ii);
        let y2 = data[ii];

        if (!isNaN(y2))
        {
          let difference = y1 - y2;
          sumOfSquares += (difference * difference);
          m++;
        }
      }
      let width = input.factor * Math.sqrt(sumOfSquares / m);
      let center = intercept + (size * slope[size - 1]);

      let curve = {};
      curve.type = "histogram";
      curve.base = 0.0;
      curve.color = "blue";
      curve.thickness = 0.75;
      curve.index = index1;
      curve.data = slope;
      output.panels[1].visuals.push(curve);

      let button = {};
      button.type = "button";
      button.index = index1;
      button.value = intercept;
      output.panels[0].visuals.push(button);

      let cLine = {};
      cLine.type = "line";
      cLine.color = "blue";
      cLine.style = "solid";
      cLine.thickness = 0.1;
      cLine.index1 = index1;
      cLine.index2 = index2;
      cLine.value1 = intercept;
      cLine.value2 = center;
      output.panels[0].visuals.push(cLine);

      let uLine = {};
      uLine.type = "line";
      uLine.color = "blue";
      uLine.style = "solid";
      uLine.thickness = 0.1;
      uLine.index1 = index1;
      uLine.index2 = index2;
      uLine.value1 = intercept + width;
      uLine.value2 = center + width;
      output.panels[0].visuals.push(uLine);

      let lLine = {};
      lLine.type = "line";
      lLine.color = "blue";
      lLine.style = "solid";
      lLine.thickness = 0.1;
      lLine.index1 = index1;
      lLine.index2 = index2;
      lLine.value1 = intercept - width;
      lLine.value2 = center - width;
      output.panels[0].visuals.push(lLine);
    }
    return output;
  };

  this.calculateMQL1 = function(input) {

    let output = {};
    output.panels = [];

    let count = input.bars.length;

    if (count >= 2) {
      let extra = 100;
      let index1 = Math.max(1, count - 1 - (input.period + extra));
      let index2 = Math.min(input.currentIndex, count - 1);

      output.panels[0] = {};
      output.panels[0].visuals = [];

      let hi = Math.max(input.bars[index1 - 1].close, input.bars[index1].high);
      let lo = Math.min(input.bars[index1 - 1].close, input.bars[index1].low);

      let up1 = false;
      let dn1 = false;

      for (let index = index1; index <= index2; index++) {

        let th = Math.max(input.bars[index - 1].close, input.bars[index].high);
        let tl = Math.min(input.bars[index - 1].close, input.bars[index].low);

        if (!isNaN(th)&& !isNaN(tl)) {

          let up0 = th > hi; //  blue
          let dn0 = tl < lo; //  red

          let outside = up0 && dn0;

          let firstBlue = up0 && !up1 && !outside;
          let firstRed  = dn0 && !dn1 && !outside;

          if (firstRed) {
            // create line at true hi
            let enable = true;
            for (let ii = index + 1; ii <= index2; ii++) {
              if (input.bars[ii].high > th) {
                enable = false;
                break;
              }
            }
            if (enable) {
              let line = {};
              line.type = "line";
              line.color = "red";
              line.style = "solid";
              line.thickness = 0.1;
              line.index1 = index - 0.125;
              line.index2 = index2 + 0.400;
              line.value1 = th;
              line.value2 = th;
              output.panels[0].visuals.push(line);
            }
          }
          if (firstBlue) {
            // create line at true low
           let enable = true;
            for (let ii = index + 1; ii <= index2; ii++) {
              if (input.bars[ii].low < tl) {
                enable = false;
                break;
              }
            }
            if (enable) {
              let line = {};
              line.type = "line";
              line.color = "blue";
              line.style = "solid";
              line.thickness = 0.1;
              line.index1 = index - 0.125;
              line.index2 = index2 + 0.400;
              line.value1 = tl;
              line.value2 = tl;
              output.panels[0].visuals.push(line);
            }
          }

          hi = (up0 || dn0 || isNaN(hi)) ? th : hi;
          lo = (up0 || dn0 || isNaN(lo)) ? tl : lo;

          up1 = up0;
          dn1 = dn0;
        }
      }
    }
    return output;
  };
}
