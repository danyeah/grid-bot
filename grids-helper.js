module.exports.fibRetracement = (min, max) => {

    const fib = getFibRetracement({ levels: {  0: max, 1: min } });
    return fib;
}

module.exports.linearGrid = (min, max, steps) => {
    let grid = [];
    let step = (max - min) / steps;
    for (let i = 0; i < steps; i++) {
        grid.push(min + (step * i));
    }
    return grid;
}