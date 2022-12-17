const qs = require('qs');
const https = require('https');
const { getFibRetracement, levels } = require('fib-retracement');
const utils = require("./utils.js")
const beep = require('beepbeep');
const fs = require('fs');
const { fibRetracement, linearGrid } = require('./grids-helper.js');
const params = require('./params.json');
try {
    params = JSON.parse(params);
} catch (err) {
    console.log(err);
}



let defaultStatus = {
    time: '',
    hasActiveTrade : false,
    lastGridPrice : 0,
    lastCurrentPrice: 0,
    shouldBuy: false,
    shouldSell: false,
    error: false,
    tokenAmount: params.capital,
    comment: "",
}

const initTradeFile = () => {
    try  {
        console.log("trades loaded from file");
        return  JSON.parse(fs.readFileSync(params.tradesFile, 'utf8'));
    } catch (err) {
        console.log('Loading defaults', status);
        return [];
    }

}






const getPrice = async (coin) => {
        let url = "https://api.coingecko.com/api/v3/coins/" + coin

        return new Promise((resolve, reject) => {
        let response = "";
        
        https.get(url, (res) => {
        //https.get(goalUrl, {options: this.options.headers},(res) => {
            
            if (res.statusCode !== 200) {
                return reject(new Error(`SERVICE: HTTP status code ${res.statusCode}`))
            }

            res.on('data', (chunk) => {
                response += chunk
            })
            

            res.on('end', () => {
                resolve(response);
            }).on('error', (e) => {
                reject(e)
            });

        })
  
    }).catch(err => {
        return { error: err}
    });
}




const makeTrade = (status) => {
    // todo get real price from dex
    let currentprice = status.lastCurrentPrice;
    let amount;
    if ( status.shouldBuy && !status.shouldSell) {
        // buy tokenAmount of token at lastCurrentPrice
        amount = status.tokenAmount / currentprice;
        console.log('Buying %s %s at %s price',amount, status.tokenAmount, currentprice);
        // throw error if amount is NaN
        
    } 
    if ( status.shouldSell && !status.shouldBuy) {
        // sell tokenAmount of token at lastCurrentPrice and return capital
        amount = status.tokenAmount * currentprice;
        console.log('Selling %s %s at %s price', amount, status.tokenAmount, currentprice);
    } 
    if ( !isNaN(amount) ) {
        return amount;
    } else {
        throw new Error("Amount is NaN");
    }
}

const tradeCheck = (currentPrice, grid, status) => {
    console.log('tradecheck'); 
     let stats = {...status};
     
 
 
 
     const getTolerance = (value) => {
         return {
             upper: value + ( value * params.tradeTolerance/100),
             lower :  value - ( value * params.tradeTolerance/100)
         }
     }
     
     let closestPrice = utils.getClosest(grid, currentPrice);
     let gridPosition = grid.findIndex(i => i == closestPrice);
     let upperGrid = gridPosition +1;
     let upperPrice = (upperGrid < grid.length ) ?  grid[upperGrid] : grid[grid.length -1]
     console.log("closest grid prize is " + closestPrice + " and upper grid is:" + upperPrice)
 
     // if active trade is true, check if we should sell
     if (status.hasActiveTrade) {
         // if current price is above closest price and above last grid price, sell
         if (currentPrice > closestPrice &&  currentPrice > status.lastGridPrice) {
             stats.comment = "Current price is above closest price, sell";
             console.log(stats.comment );
             stats.shouldSell = true;
             stats.shouldBuy = false;
             stats.hasActiveTrade = false;
             stats.lastGridPrice = closestPrice;
             stats.lastCurrentPrice = currentPrice;
             stats.error = false;
             beep(2);
         } else {
             console.log("Current price is below closest price, do nothing")
             stats.shouldSell = false;
             stats.shouldBuy = false;
             stats.hasActiveTrade = true;
             stats.lastGridPrice = closestPrice;
             stats.lastCurrentPrice = currentPrice;
             stats.error = false;
         }
     } else {
         // if active trade is false, check if we should buy 
         // if current price is below closest price, buy
         if (currentPrice < closestPrice &&  currentPrice > status.lastGridPrice) {
             stats.comment = "Current price is below closest price, buy";
             console.log(stats.comment);
             stats.shouldSell = false;
             stats.shouldBuy = true;
             stats.hasActiveTrade = true;
             stats.lastGridPrice = closestPrice;
             stats.lastCurrentPrice = currentPrice;
             stats.error = false;
             beep();
         } else {
             console.log("Current price is above closest price, do nothing")
             stats.shouldSell = false;
             stats.shouldBuy = false;
             stats.hasActiveTrade = false;
             stats.lastGridPrice = closestPrice;
             stats.lastCurrentPrice = currentPrice;
             stats.error = false;
         }
     }
 
     
 
     return stats
 }

const main = async () => {
    //let series = fibRetracement(params.startGrid, params.endGrid);
    let trades = initTradeFile();

    // if trades is not empty set status to last trade
    let status;
    if (trades.length > 0) {
        console.log('overwriting default status');
        status = trades[trades.length -1];
    } else {
        status = defaultStatus;
    }
    

    let series = linearGrid(params.startGrid, params.endGrid, params.steps);
    let fibGrid = Object.values(series).sort();
    console.log("Setting grid from %s to %s", params.startGrid, params.endGrid);
    let templ = "";
    for ( let gr of fibGrid ) {
        templ += gr + "$,  ";
    }
    console.log(templ)
    console.log(status);
    try {

        let price = await getPrice(params.buyTokenCoingeckoId);
        let priceResp = JSON.parse(price);
        console.log("Price of %s is %s",params.buyTokenCoingeckoId, priceResp.market_data.current_price["usd"])
    } catch (err) {
        console.error(err);
    }
    
    setInterval( async () =>  {
        try {
            console.log("___Check price____")
            let now = new Date().toISOString();
            let price = await getPrice(params.buyTokenCoingeckoId);
            let priceResp = JSON.parse(price);
            let priceInUsd = priceResp.market_data.current_price["usd"];
            console.log("%s: Price of %s is %s", now, params.buyTokenCoingeckoId, priceInUsd)
            status =  tradeCheck(priceInUsd, fibGrid, status)
            status.time = now;
            if ( status.shouldBuy || status.shouldSell ){
                try {

                    let trade =  makeTrade(status);
                    status.tokenAmount = trade;

                    trades.push(status);
                    // update trades file with trades array
                    fs.writeFileSync(params.tradesFile, JSON.stringify(trades));

                    console.log(status);
                } catch (err) {
                    console.error(err);
                    process.exit(1);
                }
                
            }
        } catch (err) {
            process.exit(1);
            console.error(err);
        }
    }, 5000)

    //const req = await getQuote(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
    //let resp = JSON.parse(req);
    //console.log("Selling %s %d to %s for", params.sellToken, parseInt(params.sellAmount), params.buyToken, resp.price)

}
    //https.get(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`, res => {
main();