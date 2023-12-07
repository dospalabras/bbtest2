var chart = null;
var SymbolTopic;

var inputText = "AAPL US Equity";

async function initializeChart() {
    console.log("initialize chart");
    console.trace();
    chart = new Chart("chart");
    chart.initialize();
    getBars(inputText);
    //getUserId();
    instruments = await getInstruments('msft');
    console.log(JSON.stringify(instruments));

    symbolTopic = PubSub.subscribe('SYMBOL', symbolChange);

    d3.select("#input1").on("input", function() {
        var text1 = d3.select("#input1").property("value");
        //console.log("On " +  "|" + text1 + "|" + d3.event.shiftKey + " " + d3.event.altKey + " " + d3.event.ctrlKey);
        inputText = text1.toUpperCase();
        PubSub.publish('TEXT', inputText);
      });
    
    d3.select("#input1").on("keypress", keyPress);
}

window.addEventListener('focusout', function(e)
{
  //var text1 = d3.select("#input1").property("value");
  if (inputText != "") {
    //inputText = text1.toUpperCase();
    //console.log("PUBLISH " + inputText);
    PubSub.publish('SYMBOL', inputText);
    d3.select("#input1").property("value", "");
  }
});

var symbolChange = async function(msg, symbol) {
    var instruments = await getInstruments(symbol);
    if (instruments.length > 0) {
        var text = instruments[0].security;
        symbol = symbol.replace('<', ' ').replace('>', '').toUpperCase(); 
    }
    console.log(symbol);
    getBars(symbol);
}

function loadBars(ticker, priceRecs) {
    var count = priceRecs.length;
    var bars = [];
    for(p of priceRecs) {
        var date = Date.parse(p[0]);
        var open = p[1];
        var high = p[2];
        var low = p[3];
        var close = p[4];
        var bar = new Bar(date, open, high, low, close);
        bars.push(bar);
    }
    console.log("loadBars " + ticker);
    chart.loadBars(ticker, "D", 0, bars);
}

async function getUserId() 
{
    var iam = await BB.Apps.Terminal.runFunction("IAM", 1);
    console.log(JSON.stringify(iam));
}

function yyyymmdd(dateIn) {
    var yyyy = dateIn.getFullYear();
    var mm = dateIn.getMonth()+1; // getMonth() is zero-based
    var dd  = dateIn.getDate();
    return String(10000*yyyy + 100*mm + dd); // Leading zeros for mm and dd
  }

async function getInstruments(text) {
    let session = await BB.Apps.Data.createSession();

    console.log("getInstruments");

    var instruments = [];

    var request = {
        query: text,
        yellowKeyFilter: 'YK_FILTER_NONE',
        languageOverride: 'LANG_OVERRIDE_NONE',
        maxResults: 100,
    };

    await session.request("//blp/instruments", "instrumentListRequest", request,
        function*() {
            var instrumentList;
            while(instrumentList = yield) {
                var instrumentData = instrumentList.results;
                 instrumentData.forEach(function(instrument){
                    instruments.push(instrument);               
                 });
             }
         }
    );

    return instruments;
}  

async function getBars(ticker) {
    let session = await BB.Apps.Data.createSession();

    var currentDate = new Date();
    var endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    var startDate = new Date(endDate);
    startDate = new Date(startDate.setFullYear( startDate.getFullYear() - 10 ));
    console.log(`historicalChart startDate: ${startDate}, endDate: ${endDate}`);

    var request = {
        securities: [ticker],
        fields: ["PX_OPEN", "PX_HIGH", "PX_LOW", "PX_LAST"],
        periodicitySelection: "DAILY",
        startDate: yyyymmdd(startDate),
        endDate: yyyymmdd(endDate),
    };

    session.request("//blp/refdata", "HistoricalDataRequest", request,
        function*() {
            var histData;
            var priceRecs= [];
            while(histData = yield) {
                var fieldVals = histData.securityData.fieldData;
                fieldVals.forEach(function(priceRec){
                    priceRecs.push(new Array(
                    new Date(priceRec.date.year,
                    priceRec.date.month,
                    priceRec.date.day),
                    priceRec.PX_OPEN,
                    priceRec.PX_HIGH,
                    priceRec.PX_LOW,
                    priceRec.PX_LAST));
                });
                //console.log(JSON.stringify(priceRecs));
            }
            loadBars(ticker, priceRecs);
        }
    );
}

async function keyPress() {
  var key = d3.event.keyCode;
  var text = d3.select("#input1").property("value");
  //console.log("Press " + key + " |" + text + "| " + d3.event.shiftKey + " " + d3.event.altKey + " " + d3.event.ctrlKey);
  if (key == 13) {
    instruments = await getInstruments(inputText);
    if (instruments.length > 0) {
        var symbol = instruments[0].security;
        text = symbol.replace('<', ' ').replace('>', '').toUpperCase(); 
    }
    //console.log("PUBLISH " + inputText);
    PubSub.publish('SYMBOL', text);
    var input = d3.select("#input1");
    input.property("value", "");
    return false;
  }
}
