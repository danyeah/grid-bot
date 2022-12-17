// make an self executing function
(async function () {

    const getGrid =  (min, max, steps) => {
        let grid = [];
        let step = (max - min) / steps;
        for (let i = 0; i < steps; i++) {
            grid.push(min + (step * i));
        }
        return grid;
    }
    const getParams = async () => {
        // make a request to the /params endpoint
        let params = await fetch('/params')
        // parse the response to json
        params = await params.json()
        return params
    }
    const params = await getParams();
    const returnOptions = function(dates, prices, buys, sells, parameters) {
        let grid = getGrid(parameters.startGrid, parameters.endGrid, parameters.steps);
        // foreach grid value make an object with 'yAxis' key and grid value
        let gridLines = grid.map((value) => {
            return { yAxis: value }
        })
            

        return {
            title: {
                text: 'Grid bot!',
              },
              tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: dates
            },
            yAxis: {
                type: 'value',
                min: parameters.startGrid,
                max: parameters.endGrid

            },
            series: [
                {   
                    name: 'Prices',
                    data: prices,
                    type: 'line',
                    itemStyle : { normal: {label : {show: true}}},
                    lineStyle: {color: '#000'},
                    markLine: {
                        silent: true,

                         data: gridLines,
                    }
                },
                {
                    name: 'Buys',
                    type: 'scatter',
                    data: buys,
                    lineStyle: {
                        color: 'green'
                      },
                },
                {
                    name: 'Sells',
                    type: 'scatter',
                    data: sells,
                    lineStyle: {
                        color: 'red'
                    },
                },
            ]
            };
        };

    // make a functions that will start a timer every 5 seconds and call /trades endopoint and returns the data
    const getTrades = async () => {
        // make a request to the /trades endpoint
        let trades = await fetch('/trades')
        // parse the response to json 
        trades = await trades.json()
        return trades
    }
    let trades = [];
    let dates = [];
    let prices = [];
    let buys = [];
    let sells = [];


    // initialize echarts library
    var dom = document.getElementById('container');
    var myChart = echarts.init(dom, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });

    setInterval(async () => {
        trades = await getTrades();
        if ( trades && trades.length > 0 ) {
            // get last 10  dates from the trades
            dates = trades.map(trade => trade.time).slice(-10);
            console.log('dates', dates);
            // get all the prices from the trades
            prices = trades.map(trade => trade.lastCurrentPrice).slice(-10);
            buys = trades.map(trade => {if (trade.shouldBuy ) return trade.lastGridPrice}).slice(-10);
            sells = trades.map(trade => {if (trade.shouldSell ) return trade.lastGridPrice}).slice(-10);
            console.log('prices', buys, sells);
            myChart.setOption(returnOptions(dates, prices, buys, sells, params));
            
        }
    }, 5000);





})();
