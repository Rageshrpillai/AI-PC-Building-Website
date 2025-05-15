// src/services/apiService.js

/**
 * Fetches a list of products from local mock JSON files based on category.
 * @param {string} category - The category of parts to fetch (e.g., 'cpu').
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of product objects.
 * @throws {Error} If the file cannot be fetched or parsed.
 */
export const fetchProducts = async (category = "cpu") => {
  let fileName = "";

  // Determine the filename based on the category
  // We'll use plural for filenames as we created 'cpus.json'
  if (category.toLowerCase() === "cpu") {
    fileName = "cpus.json";
  } else if (category.toLowerCase() === "gpu") {
    fileName = "gpus.json"; // Example for when you add GPU data
  }
  // Add more 'else if' blocks here as you create more JSON files for other categories
  // e.g., 'motherboard' -> 'motherboards.json'
  else {
    console.error(`Mock data for category '${category}' is not yet available.`);
    // Return an empty array or throw an error if the category file isn't defined
    return Promise.resolve([]); // Resolve with empty for now to prevent unhandled promise rejection
  }

  const filePath = `/data/${fileName}`; // Path relative to the 'public' folder

  try {
    console.log(
      `Workspaceing mock products for category: ${category} from local file: ${filePath}`
    );
    // 'fetch' can be used to get files from your 'public' directory
    const response = await fetch(filePath);

    if (!response.ok) {
      // This will happen if the file doesn't exist at the path or there's a server error
      throw new Error(
        `Could not fetch ${filePath}. Status: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json(); // Parse the JSON data from the file

    // Our local JSON files are expected to directly contain an array of products
    if (Array.isArray(data)) {
      return data;
    } else {
      console.warn(
        `Data in ${filePath} is not an array as expected. Received:`,
        data
      );
      return []; // Return empty array if the format is not a direct array
    }
  } catch (error) {
    console.error(
      `Failed to fetch or parse mock products for category ${category} from ${filePath}:`,
      error
    );
    // Re-throw the error so the calling component (SpecsListPage) can handle it in its catch block
    throw error;
  }
};
