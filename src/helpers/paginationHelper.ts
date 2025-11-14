type IOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

type IOptionsResults = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
};
const calculatePagination = (options: IOptions): IOptionsResults => {
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;

  // User jei field dei, ta use hobe, default "createdAt"
  const sortBy = options.sortBy || "createdAt";

  // Default order choto theke boro → asc
  const sortOrder = "desc"

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};
function encodeCursor(dt: Date, id: string) {
  return Buffer.from(`${dt.toISOString()}|${id}`).toString("base64");
}
function decodeCursor(cursor?: string | null) {
  if (!cursor) return null;
  const [iso, id] = Buffer.from(cursor, "base64").toString("utf8").split("|");
  return { createdAt: new Date(iso), id };
}


export const paginationHelper = {
  calculatePagination, encodeCursor, decodeCursor
};