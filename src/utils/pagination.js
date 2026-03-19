exports.getPagination = (page, limit) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum
  };
};

exports.formatPaginatedResponse = (data, total, page, limit) => {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};