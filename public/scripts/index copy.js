let analysis_selector = [];
let analysis_view = [];
let analysis_id = [
  "first_destination",
  "top_employers",
  "starting_salary",
  "top_universities",
  "degree_types",
  "fields_of_study",
];

// Identifying all the selector div
for (let i = 0; i < 6; i++) {
  analysis_selector.push(document.getElementById(analysis_id[i]));
  analysis_view.push(document.getElementById(analysis_id[i] + "_view"));
}

let selected_analysis = analysis_selector[0];
let selected_view = analysis_view[0];

let selected_choices = {};

// Asssigning Event Listener to each of them
for (let i = 0; i < 6; i++) {
  analysis_selector[i].addEventListener("click", function () {
    if (analysis_selector[i] != selected_analysis) {
      console.log("event listener for: ", analysis_selector[i].id);
      console.log("selected analysis is: ", selected_analysis.id);

      selected_view.classList.remove("selected");
      selected_analysis.classList.remove("selected");

      selected_view = analysis_view[i];
      selected_analysis = analysis_selector[i];

      selected_view.classList.add("selected");
      selected_analysis.classList.add("selected");

      populateAnalysis();
    }
  });
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", function () {
  populateSelectOptions("page_load");
  populateAnalysis();
});

// Attach the function to the change event of "select" elements
const selectElements = document.querySelectorAll(
  'select[name="year"], select[name="school"], select[name="major"]'
);
selectElements.forEach((select) => {
  select.addEventListener("change", async function () {
    await populateSelectOptions(select.name);
  });
});

async function fetchData(request_method, end_point, data) {
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

    return await response.json(); // Returning whatever we get
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

// Rendering the choices
async function populateSelectOptions(select_name) {
  // Updating the current selected values
  switch (select_name) {
    case "page_load":
      selected_choices.year = "all";
      selected_choices.school = "all";
      selected_choices.major = "all";
      break;
    case "year":
      selected_choices.year = document.querySelector(
        'select[name="year"]'
      ).value;
      break;
    case "school":
      selected_choices.school = document.querySelector(
        'select[name="school"]'
      ).value;
      break;
    case "major":
      selected_choices.major = document.querySelector(
        'select[name="major"]'
      ).value;
      break;
    default:
      console.log(`Couldn't recognise the select element ${select_name}`);
  }

  // Geting the appropriate select data from the server
  let select_data = await fetchData("POST", "/update/select", {
    selected_choices: selected_choices,
  });

  selected_choices = select_data.current_choices; //setting the value of select choices baesed on backend processing
  let select_id = {
    year: "year-select",
    school: "school-select",
    major: "major-select",
  };
  for (key in select_data.choices) {
    const selectElement = document.getElementById(select_id[key]); // selecting the appropriate select elemnt
    selectElement.innerHTML = ""; // Clearing the previous options

    select_data.choices[key].forEach((option, index) => {
      const optionElement = document.createElement("option"); // Adding new options which we recieved from server
      if (index == 0) {
        optionElement.value = "all";
        optionElement.textContent = option;
      } else {
        optionElement.value = option;
        optionElement.textContent = option;
      }
      if (option === selected_choices[key]) {
        optionElement.selected = true;
      }
      selectElement.appendChild(optionElement);
    });
  }
}

// Rendering the Analysis
async function populateAnalysis() {
  let fetch_response = await fetchData("POST", "/update/analysis", {
    selected_analysis: selected_analysis.id,
  });
  let analysis_data = fetch_response.analysis_data;
  console.log(analysis_data);
  const table_display_limit = 45;

  let analysis_id = [
    "first_destination",
    "top_employers",
    "starting_salary",
    "top_universities",
    "degree_types",
    "fields_of_study",
  ];

  switch (selected_analysis.id) {
    case "first_destination":
      console.log("first_destination");
      // Define the ordered outcomes
      const ordered_outcome = {
        red: [
          "Full-Time",
          "Military",
          "Continuing Education",
          "Self-employed",
          "Part-time",
          "Internship",
        ],
        white: [
          "Currently seeking employment",
          "Not Seeking Employment",
          "No-Info",
        ],
      };
      // Convert counts to integers
      analysis_data.forEach((item) => {
        item.count = parseInt(item.count);
      });
      // Sort the analysis_data array based on red and white category and then from count
      analysis_data.sort((a, b) => {
        // positive retrun => (b,a); negetive return => (a,b)
        const a_in_red = ordered_outcome.red.includes(a.outcome);
        const b_in_red = ordered_outcome.red.includes(b.outcome);

        if (a_in_red && b_in_red) {
          return b.count - a.count;
        } else if (a_in_red && !b_in_red) {
          return -1;
        } else if (!a_in_red && b_in_red) {
          return 1;
        } else {
          return b.count - a.count;
        }
      });
      // Extracting arrays of outcomes and counts
      const ordered_label = analysis_data.map(({ outcome }) => outcome);
      const ordered_data = analysis_data.map(({ count }) => count);  
      
      // Prepare data
      const data = {
        labels: ordered_label,
        datasets: [
          {
            label: "Weekly Sales",
            data: ordered_data,
            backgroundColor: [
              "#FF0000",
              "#FF9F40 ",
              "#FFCE56",
              "#008000",
              "#82E0AA ",
              "#0000FF",
              "#4B0082",
              "#36A2EB",
            ],
            // borderColor: [
            //   'rgba(255, 26, 104, 1)',
            //   'rgba(54, 162, 235, 1)',
            //   'rgba(255, 206, 86, 1)',
            //   'rgba(75, 192, 192, 1)',
            //   'rgba(153, 102, 255, 1)',
            //   'rgba(255, 159, 64, 1)',
            //   'rgba(0, 0, 0, 1)'
            // ],
            borderWidth: 1,
          },
        ],
      };

      // config
      const config = {
        type: "doughnut",
        data,
        options: {
          plugins: {
            legend: {
              position: "right",
            },
          },

          parsing: {
            key: "count",
          },
        },
      };

      let ctx = document.getElementById("first_destination_chart").getContext("2d"); // Get the canvas element
      // Destroy the existing Chart object if it exists
      if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
      }
      // render the chart
      const myChart = new Chart(ctx, config);
      break;

    case "top_employers":
      console.log("top_employers");
      const tbody = document.getElementById("top_employer_table"); // Get the table body element
      // Conditioning data for display
      let display_data = analysis_data.slice(0, table_display_limit);
      //Rendering the data in HTML page
      for (let i = 0; i < display_data.length; i++) {
        const tr = document.createElement("tr");
        // tr.innerHTML = `
        //         <td>${i + 1}. ${display_data[i].employer}</td>
        //         <td>${++i + 1}. ${display_data[i].employer}</td>
        //    `;
        tr.innerHTML = `<td>${display_data[i].employer}</td>`;
        tr.innerHTML +=
          ++i < display_data.length
            ? `<td>${display_data[i].employer}</td>`
            : "";
        tbody.appendChild(tr);
      }
      break;

    case "starting_salary":
      console.log("starting_salary");
      break;
    case "top_universities":
      console.log("top_universities");
      break;
    case "degree_types":
      console.log("degree_types");
      break;
    case "fields_of_study":
      console.log("fields_of_study");
      break;
    default:
      console.log("Can not recognise the Selected Analysis");
  }
}
