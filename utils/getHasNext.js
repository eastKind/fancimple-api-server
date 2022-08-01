async function getHasNext(model, filter, limit) {
  const count = await model.countDocuments(filter);
  return count - limit > 0;
}

module.exports = getHasNext;
