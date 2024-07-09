
  
// Function to get data from backend, by making appropriate requet. 
export async function fetchData(request_method, end_point, data) {
    try {
      const response = await fetch(end_point, {
        method: request_method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return await response.json(); // Returning whatever we get from the backend
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }
  