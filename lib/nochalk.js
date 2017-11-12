const colors = ['dim', 'cyan', 'green', 'yellow', 'red', 'white']
const identity = value => value

module.exports = colors.reduce(
  (map, color) => {
    map[color] = identity
    return map
  }, {})
