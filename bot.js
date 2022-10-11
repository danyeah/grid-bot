const qs = require('qs');
const https = require('https');
const { getFibRetracement, levels } = require('fib-retracement');
const utils = require("./utils.js")
const params = {
    // Not all token symbols are supported. The address of the token can be used instead.
    sellToken: 'DAI',
    buyToken: 'WETH',
    buyTokenCoingeckoId: 'ethereum',
    // Note that the DAI token uses 18 decimal places, so `sellAmount` is `100 * 10^18`.
    sellAmount: '100000000000000000',
    startGrid: 1400,
    endGrid: 1500,
    tradeTolerance: 0.10
}

let status = {
    hasActiveTrade : false,
    lastGridPrice : 0,
    lastCurrentPrice: 0,
    shouldBuy: false,
    shouldSell: false,
    error: false
}


const fibRetracement = (min, max) => {

    const fib = getFibRetracement({ levels: {  0: max, 1: min } });
    return fib;
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
const getQuote = async (url) => {

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

const tradeCheck = (currentPrice, grid, status) => {
    console.log("___Check trade____")
    let stats = {};
    // finds the closest price in the grid of the current price
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
    let closestPriceTolerance = getTolerance(closestPrice);
    let upperPriceTolerance = getTolerance(upperPrice)
    console.log("closest price tolerance %s %s", closestPriceTolerance.lower, closestPriceTolerance.upper)
    console.log("upper price tolerance %s %s", upperPriceTolerance.lower, upperPriceTolerance.upper)
    console.log("should buy", currentPrice >= closestPriceTolerance.lower && currentPrice <= closestPriceTolerance.upper)
    console.log("should sell", currentPrice >= upperPriceTolerance.lower && currentPrice <= upperPriceTolerance.upper)
 
    // bot hasnt bought anything
    if  (currentPrice >= closestPriceTolerance.lower || currentPrice <= closestPriceTolerance.upper) {
        stats.shouldBuy = true;
        stats.shouldSell = false;
        stats.hasActiveTrade = true;
        stats.lastGridPrice = closestPrice;
        stats.lastCurrentPrice = currentPrice;
    }
    if  (currentPrice >= upperPriceTolerance.lower || currentPrice <= upperPriceTolerance.upper) {
        stats.shouldBuy = false;
        stats.shouldSell = true;
        stats.hasActiveTrade = false;
        stats.lastGridPrice = upperPrice;
        stats.lastCurrentPrice = currentPrice;
    }
    console.log(stats);
    return stats
}

const main = async () => {
    let series = fibRetracement(params.startGrid, params.endGrid);
    let fibGrid = Object.values(series).sort();
    console.log("Setting Fibonacci grid from %s to %s", params.startGrid, params.endGrid);
    let templ = "";
    for ( let gr of fibGrid ) {
        templ += gr + "$,  ";
    }
    console.log(templ)
    try {

        let price = await getPrice(params.buyTokenCoingeckoId);
        let priceResp = JSON.parse(price);
        console.log("Price of %s is %s",params.buyTokenCoingeckoId, priceResp.market_data.current_price["usd"])
    } catch (err) {
        console.error(err);
    }
    
    setInterval( async () =>  {
        try {
            
            let price = await getPrice(params.buyTokenCoingeckoId);
            let priceResp = JSON.parse(price);
            let priceInUsd = priceResp.market_data.current_price["usd"];
            let stat =  tradeCheck(priceInUsd, fibGrid, status)
            console.log("Price of %s is %s",params.buyTokenCoingeckoId, priceInUsd)
        } catch (err) {
            console.error(err);
        }
    }, 5000)

    //const req = await getQuote(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
    //let resp = JSON.parse(req);
    //console.log("Selling %s %d to %s for", params.sellToken, parseInt(params.sellAmount), params.buyToken, resp.price)

}
    //https.get(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`, res => {
main();