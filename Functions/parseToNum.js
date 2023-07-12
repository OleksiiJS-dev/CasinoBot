const parseToNum = (numberToParse) => {
    let parsedNumber = numberToParse;
    parsedNumber = parsedNumber.toFixed(3);
    parsedNumber = parseFloat(parsedNumber);
    return parsedNumber
    
};

module.exports = { parseToNum }