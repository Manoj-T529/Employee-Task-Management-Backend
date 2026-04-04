const prisma = require("../config/prisma");
const catchAsync = require("../utils/catchAsync");

exports.getLookups = catchAsync(async (req, res) => {
  const lookups = await prisma.lookups.findMany({
    orderBy:[
      { type: 'asc' },
      { display_order: 'asc' }
    ]
  });

  // Group by 'type' (e.g., STATUS, PRIORITY)
  const groupedLookups = lookups.reduce((acc, curr) => {
    if (!acc[curr.type]) {
      acc[curr.type] =[];
    }
    acc[curr.type].push({
      id: curr.id,
      code: curr.code,
      value: curr.value
    });
    return acc;
  }, {});

  res.status(200).json({ status: "success", data: groupedLookups });
});