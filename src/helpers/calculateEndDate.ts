export const calculateEndDate = (startDate: Date, duration: string): Date => {
  const days = parseInt(duration.split(" ")[0]); // "30 days" → 30
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  return endDate;
};