module.exports = {
  pushArrayField: (obj, field, value) => {
    obj[field] = obj[field] || []
    obj[field].push(value)
  },
  values: obj => Object.keys(obj).map(key => obj[key])
}
