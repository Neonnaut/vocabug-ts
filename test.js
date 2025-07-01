function valid_weights(str) {
  // Rule 1: Colon must be followed by a digit
  const colonWithoutDigit = /:(?!\d)/g;

  // Rule 2: Colon must not appear at the start
  const colonAtStart = /^:/;

  // Rule 3: Colon must not be preceded by space or comma
  const colonAfterSpaceOrComma = /[ ,]:/g;

  // Rule 4: Colon-digit pair must be followed by space, comma, or end of string
  const colonDigitBadSuffix = /:\d+(?![ ,]|$)/g;

  if (colonWithoutDigit.test(str)) {
    console.log("❌ Rule 1 failed: Colon not followed by digit.");
    return false;
  }

  if (colonAtStart.test(str)) {
    console.log("❌ Rule 2 failed: Colon at the start of the string.");
    return false;
  }

  if (colonAfterSpaceOrComma.test(str)) {
    console.log("❌ Rule 3 failed: Colon appears after a space or comma.");
    return false;
  }

  if (colonDigitBadSuffix.test(str)) {
    console.log("❌ Rule 4 failed: Colon-digit pair not followed by space, comma, or end of string.");
    return false;
  }

  return true;
}

const str = '[t:9, tr] n [k:13, kr] m r s [p:12, pr] h w j';
//console.log(valid_weights('[t:9, tr] n [k:13, kr] m r s [p:12, pr] h w j'))

console.log([...str.matchAll(/:\d+(?![ ,]|$)/g)]);