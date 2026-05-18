import { useMemo, useState } from "react";

const getNestedValue = (obj, path) => {
    if (!obj || !path) return [];

    const parts = path.split(".");

    const extract = (current, index) => {
        if (current == null) return [];

        // finished path
        if (index >= parts.length) {
            return [current];
        }

        let key = parts[index];

        // handle array field => grades[]
        if (key.includes("[]")) {
            key = key.replace("[]", "");

            const arr = current[key];

            if (!Array.isArray(arr)) return [];

            return arr.flatMap((item) =>
                extract(item, index + 1)
            );
        }

        return extract(current[key], index + 1);
    };

    return extract(obj, 0);
};

const matchValue = (value, search) => {
    if (value == null) return false;

    // primitive
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value)
            .toLowerCase()
            .includes(search.toLowerCase());
    }

    // array
    if (Array.isArray(value)) {
        return value.some((v) => matchValue(v, search));
    }

    // object
    if (typeof value === "object") {
        return Object.values(value).some((v) =>
            matchValue(v, search)
        );
    }

    return false;
};

export const useFilter = ({ data = [], fields = [], search = "", extraFilters = {}}) => {
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // SEARCH FILTER
      const searchMatch =
        !search ||
        fields.some((field) => {
          const values = getNestedValue(item, field);

          return values.some((value) =>
            matchValue(value, search)
          );
        });

      // EXTRA FILTERS
      const extraMatch = Object.entries(extraFilters).every(
        ([key, value]) => {
          if (!value || value === "ALL") return true;

          return item[key] === value;
        }
      );

      return searchMatch && extraMatch;
    });
  }, [data, fields, search, extraFilters]);

  return filteredData;
};

// Usage Examples

// 1. Simple Object Array
// const users = [
//     { name: "John", email: "john@gmail.com" },
//     { name: "Alice", email: "alice@gmail.com" },
// ];

// const { search, setSearch, filteredData } = useFilter({
//     data: users,
//     fields: ["name", "email"],
// });


// 2. Nested Object Search
// const products = [
//     {
//         name: "Shrimp",
//         category: {
//             name: "Seafood",
//         },
//     },
// ];

// const { filteredData } = useFilter({
//     data: products,
//     fields: ["name", "category.name"],
// });


// 3. Array Inside Object
// const suppliers = [
//     {
//         name: "ABC Supplier",
//         grades: [
//             { gradeName: "A" },
//             { gradeName: "B" },
//         ],
//     },
// ];

// const { filteredData } = useFilter({
//     data: suppliers,
//     fields: [
//         "name",
//         "grades[].gradeName",
//     ],
// });


// 4. Deep Nested Mixed Structure
// const data = [
//     {
//         supplier: {
//             company: {
//                 name: "Ocean Foods",
//             },
//         },
//         products: [
//             {
//                 grades: [
//                     { name: "Premium" },
//                 ],
//             },
//         ],
//     },
// ];

// const { filteredData } = useFilter({
//     data,
//     fields: [
//         "supplier.company.name",
//         "products[].grades[].name",
//     ],
// });