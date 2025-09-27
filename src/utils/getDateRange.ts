const getDateRange = (filterType?: string) => {
  const now = new Date();
  let start: Date | undefined;

  switch (filterType) {
    case "today":
      start = new Date();
      start.setHours(0, 0, 0, 0);
      break;

    case "1d":
      start = new Date();
      start.setDate(start.getDate() - 1);
      break;

    case "7d":
      start = new Date();
      start.setDate(start.getDate() - 7);
      break;
    case "15d":
      start = new Date();
      start.setDate(start.getDate() - 15);
      break;

    case "30d":
    case "1mo":
      start = new Date();
      start.setDate(start.getDate() - 30);
      break;
  }

  return { start };
};

export default getDateRange;
