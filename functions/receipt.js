let keywords = ["payment amount", "amount due", "amount", "grand total", "total"];
let moneyRegex = /^\$?([0-9]+(\.[0-9]{1,2})?)$/;
let decimalMoneyRegex = /^\$?(\d+[\.,][ ]?\d{2})$/;
let debug = true;

const parseAmount = function(line) {
  let result = moneyRegex.exec(line);
  if (result === null) return null;
  else return result[1];
};

const parseDecimalAmount = function(line) {
  var result = decimalMoneyRegex.exec(line);
  if (result === null) return null;
  else return result[1].replace(" ","").replace(",",".");
};

exports.detectMax = function(annotations) {
  var candidates = [];
  annotations.forEach(detection => {
    var amount = parseDecimalAmount(detection.description);
    if (amount !== null) {
      candidates.push(amount);
    }
  });
  if (debug) {
    console.log("detectMax candidates:", candidates);
  }
  candidates = candidates.map(c => Number(c));
  return Math.max.apply(null, candidates);
}

exports.detectTotal = function(raw) {
  let textLinesArray = raw.split("\n");
  var candidates = [];
  for (var i = 0; i < textLinesArray.length; i++) {
    for (word of keywords) {
      if (textLinesArray[i].toLowerCase().indexOf(word) !== -1) {
        // check if the group before was an amount, and prefer it over having an
        // amount listed before it
        var amountFound = false;
        if (i < textLinesArray.length-1) {
          var amount = parseAmount(textLinesArray[i+1]);
          if (amount !== null) {
            candidates.push([word, amount]);
            amountFound = true;
          }
        }
        // check if the next group was an amount
        if (i > 0 && !amountFound) {
          var amount = parseAmount(textLinesArray[i-1]);
          if (amount !== null) {
            candidates.push([word, amount]);
          }
        }
        break; // only capture the "first" of the keywords found since we look
               // for both "grand total" and "total" and such
      }
    }
  }
  if (debug) {
    console.log("detectTotal candidates:", candidates);
  }

  // choose the max candidate ... I guess? Or most repeated one?
  if (candidates.length === 0) {
    return null;
  } else {
    candidates = candidates.map(c => Number(c[1]));
    return Math.max.apply(null, candidates);
  }
};

exports.findTotal = function findTotal(detections) {
  const regex = '^[$]?\s*(\\d+[\\.,]\\d{2})$';
  const amounts = detections
    .filter(text => text.description.match(regex))
    .map(text => text.description.match(regex)[1])
    .map(text => text.replace(',', '.'))
    .map(text => Number(text))
    .concat([0.0]);
  //console.log(amounts);
  return Math.max.apply(null, amounts);
}
