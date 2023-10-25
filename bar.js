function Bar(time, open, high, low, close) {
  this.timeStamp = time;
  this.dateTime = null;
  this.open = open;
  this.high = high;
  this.low = low;
  this.close = close;

  this.getDateTime = function() {
      if (this.dateTime == null) {
        this.dateTime = moment.unix(this.timeStamp / 1000);
      }
      return this.dateTime;
  };
}
