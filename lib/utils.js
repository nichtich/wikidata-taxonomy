module.exports = {
  pushArrayField: (obj, field, value) => {
    obj[field] = obj[field] || []
    obj[field].push(value)
  }
}
