exports.getClosest = (arr, target) => {
  if (!(arr) || arr.length == 0)
    return null;
  if (arr.length == 1)
    return arr[0];

  for (var i = 1; i < arr.length; i++) {
    // As soon as a number bigger than target is found, return the previous or current
    // number depending on which has smaller difference to the target.
    if (arr[i] > target) {
      var p = arr[i - 1];
      var c = arr[i]
      return Math.abs(p - target) < Math.abs(c - target) ? p : c;
    }
  }
  // No number in array is bigger so return the last.
  return arr[arr.length - 1];
}