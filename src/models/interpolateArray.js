// for changing the sampling rate, reference:
// http://stackoverflow.com/a/28977136/552182

const linearInterpolate = (before, after, atPoint) => before + (after - before) * atPoint

// const interpolateArray = (data, newSampleRate, oldSampleRate) => {
//   const fitCount = Math.round(data.length * (newSampleRate / oldSampleRate))
//   const newData = []
//   const springFactor = Number((data.length - 1) / (fitCount - 1))
//   newData[0] = data // newData[0] = data[0] // for new allocation
//   for (let i = 1; i < fitCount - 1; i += 1) {
//     const tmp = i * springFactor
//     const before = Number(Math.floor(tmp)).toFixed()
//     const after = Number(Math.ceil(tmp)).toFixed()
//     const atPoint = tmp - before
//     newData[i] = linearInterpolate(data[before], data[after], atPoint)
//   }
//   newData[fitCount - 1] = data[data.length - 1] // for new allocation
//   return newData
// }


// for changing the sampling rate, reference:
// http://stackoverflow.com/a/28977136/552182
const interpolateArray = (data, newSampleRate, oldSampleRate) => {
  var fitCount = Math.round(data.length * (newSampleRate / oldSampleRate));
  var newData = [];
  var springFactor = Number((data.length - 1) / (fitCount - 1));
  newData[0] = data[0]; // for new allocation
  for (var i = 1; i < fitCount - 1; i++) {
    var tmp = i * springFactor;
    var before = Number(Math.floor(tmp)).toFixed();
    var after = Number(Math.ceil(tmp)).toFixed();
    var atPoint = tmp - before;
    newData[i] = linearInterpolate(data[before], data[after], atPoint);
  }
  newData[fitCount - 1] = data[data.length - 1]; // for new allocation
  return newData;
}

export default interpolateArray
