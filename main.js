var chart = null;
var priceRecs= [];

function initializeChart() {
    console.log("initialize chart");
    chart = new Chart("chart");
    chart.initialize();
    getBars();
}

function loadBars() {
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
    console.log("loadBars");
    chart.loadBars("AAPL US Equity", "D", 0, bars);
}

function yyyymmdd(dateIn) {
    var yyyy = dateIn.getFullYear();
    var mm = dateIn.getMonth()+1; // getMonth() is zero-based
    var dd  = dateIn.getDate();
    return String(10000*yyyy + 100*mm + dd); // Leading zeros for mm and dd
  }

async function getBars() {
    let session = await BB.Apps.Data.createSession();
    
    var ticker = "AAPL US Equity";

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
            while(histData = yield) {
                //console.info(JSON.stringify(histData, undefined, 4));
                //console.log("inside receiver");
                var fieldVals = histData.securityData.fieldData;
                fieldVals.forEach( function(priceRec){
                    priceRecs.push(new Array(new Date(priceRec.date.year,
                    priceRec.date.month,
                    priceRec.date.day),
                    priceRec.PX_OPEN,
                    priceRec.PX_HIGH,
                    priceRec.PX_LOW,
                    priceRec.PX_LAST));
                });
                //console.log(JSON.stringify(priceRecs));
            }
            loadBars();
        }
    );
}

