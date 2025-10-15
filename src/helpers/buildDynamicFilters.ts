// // utils/buildDynamicFilters.ts
// const EXCLUDED_KEYS = ["page", "limit", "sortBy", "sortOrder"];

// export const buildDynamicFilters = (
//   filters: Record<string, any>,
//   searchableFields: string[]
// ): Record<string, any> => {
//   const andConditions: any[] = [];

//   if (filters.searchTerm?.trim()) {
//     andConditions.push({
//       OR: searchableFields.map((field) => ({
//         [field]: {
//           contains: filters.searchTerm,
//           mode: "insensitive",
//         },
//       })),
//     });
//   }

//   const { searchTerm, ...rest } = filters;

//   const normalizeFilterValue = (value: any) => {
//     if (typeof value === "string") {
//       const trimmedValue = value.trim();
//       const lowerCasedValue = trimmedValue.toLowerCase();

//       if (lowerCasedValue === "true") {
//         return true;
//       }
//       if (lowerCasedValue === "false") {
//         return false;
//       }

//       return trimmedValue;
//     }

//     return value;
//   };

//   for (const [key, value] of Object.entries(rest)) {
//     if (
//       value !== undefined &&
//       value !== null &&
//       value !== "" &&
//       !EXCLUDED_KEYS.includes(key)
//     ) {
//       andConditions.push({ [key]: normalizeFilterValue(value) });
//     }
//   }

//   return andConditions.length > 0 ? { AND: andConditions } : {};
// };


// utils/buildDynamicFilters.ts

const EXCLUDED_KEYS = ["page", "limit", "sortBy", "sortOrder"];

export const buildDynamicFilters = (
  filters: Record<string, any>,
  searchableFields: string[]
): Record<string, any> => {
  const andConditions: any[] = [];

  // --- 1. Handle searchTerm ---
  if (filters.searchTerm?.trim()) {
    andConditions.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: filters.searchTerm.trim(),
          mode: "insensitive",
        },
      })),
    });
  }

  const { searchTerm, ...rest } = filters;

  // --- 2. Normalize filter values ---
  const normalizeFilterValue = (value: any) => {
    if (typeof value === "string") {
      const trimmedValue = value.trim().toLowerCase();

      // Convert booleans
      if (trimmedValue === "true") return true;
      if (trimmedValue === "false") return false;

      // Convert numbers (only if it's a valid numeric string)
      if (!isNaN(Number(trimmedValue)) && trimmedValue !== "") {
        return Number(trimmedValue);
      }

      return value.trim();
    }

    return value;
  };

  // --- 3. Build Prisma-compatible AND conditions ---
  for (const [key, rawValue] of Object.entries(rest)) {
    if (
      rawValue !== undefined &&
      rawValue !== null &&
      rawValue !== "" &&
      !EXCLUDED_KEYS.includes(key)
    ) {
      const normalizedValue = normalizeFilterValue(rawValue);
      andConditions.push({ [key]: normalizedValue });
    }
  }

  // --- 4. Return clean where clause ---
  return andConditions.length > 0 ? { AND: andConditions } : {};
};
