async function gethasNext(model, cursor, limit) {
  const filter = cursor ? { _id: { $lt: cursor } } : {};
  const hasNext = (await model.countDocuments(filter)) - limit > 0;
  return hasNext;
}

module.exports = gethasNext;
