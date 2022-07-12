async function getPaging(model, cursor, limit) {
  const filter = cursor ? { _id: { $lt: cursor } } : {};
  let count = (await model.countDocuments(filter)) - limit;
  if (count < 0) count = 0;
  const hasNext = count > 0;
  return { count, hasNext };
}

module.exports = getPaging;
