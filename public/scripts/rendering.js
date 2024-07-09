//importing funcitons
import { fetchData } from "/scripts/dataFetching.js";
fetchData;

// Rendering the choices
export async function populateSelectOptions(select_name, selected_choices) {
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
      if (selected_choices.year === "all") {
        selected_choices.school = "all";
        selected_choices.major = "all";
      }
      break;
    case "school":
      selected_choices.school = document.querySelector(
        'select[name="school"]'
      ).value;
      if (selected_choices.school === "all") {
        selected_choices.major = "all";
      }
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

  for (let key in select_data.choices) {
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

  return selected_choices;
}

// Rendering the Analysis
export async function populateAnalysis(selected_analysis) {
  let fetch_response = await fetchData("POST", "/update/analysis", {
    selected_analysis: selected_analysis.id,
  });
  let analysis_data = fetch_response.analysis_data;
  const table_display_limit = 45;

  switch (selected_analysis.id) {
    case "first_destination":
      // console.log("first_destination");
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
      let outcomes_ordered_label = [];
      let outcomes_ordered_data = [];
      let combine_outcome = [];

      analysis_data.forEach((item) => {
        outcomes_ordered_label.push(item.outcome); // Add outcome to labels array
        outcomes_ordered_data.push(item.count); // Add count to data array

        // Check if outcome belongs to red category
        if (ordered_outcome.red.includes(item.outcome)) {
          combine_outcome[0] += item.count; // Increment sum for red outcomes
        } else if (ordered_outcome.white.includes(item.outcome)) {
          combine_outcome[1] += item.count; // Increment sum for white outcomes
        }
      });  

      // Rendering the chart via custom function
      renderDoughnutChart( outcomes_ordered_label, outcomes_ordered_data, "first_destination_chart");

      break;

    case "top_employers":
      // console.log("top_employers");
      const empl_tbody = document.getElementById("top_employer_table"); // Get the table body element
      empl_tbody.innerHTML = "";
      // Conditioning data for display
      let empl_display_data = analysis_data.slice(0, table_display_limit);
      //Rendering the data in HTML page
      for (let i = 0; i < empl_display_data.length; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${empl_display_data[i].employer}</td>`;
        tr.innerHTML +=
          ++i < empl_display_data.length
            ? `<td>${empl_display_data[i].employer}</td>`
            : "";
        empl_tbody.appendChild(tr);
      }
      break;

    case "starting_salary":
      // console.log("starting_salary");
      // Converting salary data to float with 2 decimal places
      analysis_data.forEach((item) => {
        item.average_salary = parseFloat(item.average_salary).toFixed(2);
        item.median_salary = parseFloat(item.median_salary).toFixed(2);
        item.max_salary = parseFloat(item.max_salary).toFixed(2);
      });

      let salary_data_id = ["average_salary", "median_salary", "max_salary"];
      salary_data_id.forEach((id) => {
        let salary_div = document.getElementById(id); //getting the Salary div
        salary_div.innerHTML = `$${analysis_data[0][id]}`;
      });
      break;

    case "top_universities":
      // console.log("top_universities");
      const uni_tbody = document.getElementById("top_universities_table"); // Get the table body element
      uni_tbody.innerHTML = "";
      // Conditioning data for display
      let uni_display_data = analysis_data.slice(0, table_display_limit);
      //Rendering the data in HTML page
      for (let i = 0; i < uni_display_data.length; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${uni_display_data[i].cont_edu}</td>`;
        tr.innerHTML +=
          ++i < uni_display_data.length
            ? `<td>${uni_display_data[i].cont_edu}</td>`
            : "";
        uni_tbody.appendChild(tr);
      }

      break;

    case "degree_types":
      // console.log("degree_types");
      // Convert counts to integers
      analysis_data.forEach((item) => {
        item.count = parseInt(item.count);
      });
      // Sort the analysis_data array based on count
      analysis_data.sort((a, b) => {
        return b.count - a.count;
      });
      // Extracting arrays of degree and counts
      const degree_ordered_label = analysis_data.map(
        ({ cont_edu_degree }) => cont_edu_degree
      );
      const degree_ordered_data = analysis_data.map(({ count }) => count);
      renderDoughnutChart(
        degree_ordered_label,
        degree_ordered_data,
        "degree_types_chart"
      );

      break;

    case "fields_of_study":
      // console.log("fields_of_study");
      // Convert counts to integers
      analysis_data.forEach((item) => {
        item.count = parseInt(item.count);
      });
      // Sort the analysis_data array based on count
      analysis_data.sort((a, b) => {
        return b.count - a.count;
      });
      // Extracting arrays of degree and counts
      const field_ordered_label = analysis_data.map(
        ({ cont_edu_field }) => cont_edu_field
      );
      const field_ordered_data = analysis_data.map(({ count }) => count);
      renderDoughnutChart(
        field_ordered_label,
        field_ordered_data,
        "fields_of_study_chart"
      );
    
      break;

    default:
      console.log("Can not recognise the Selected Analysis");
  }
}

function renderDoughnutChart(chart_label, chart_data, elemnt_id, level_0_data = null) {
    let datasets = [];
  
    // Defining 0 level of Doughnut chart if level_0_data is present
    if (level_0_data != null) {
      datasets.push({
        label: "Level 2",
        data: level_0_data,
        backgroundColor: ["#FF0000", "#FFFFFF"],
      });
    }
    
    // Level 1 of Doughnut Chart
    datasets.push({
      label: "Level 1",
      data: chart_data,
      backgroundColor: [
        "#FF0000",
        "#FF9F40",
        "#FFCE56",
        "#008000",
        "#82E0AA",
        "#0000FF",
        "#4B0082",
        "#36A2EB",
      ],
    });
  
    // Prepare data
    const data = {
      labels: chart_label,
      datasets: datasets,
    };
  
    // config
    const config = {
      type: "doughnut",
      data: data,
      options: {
        plugins: {
          legend: {
            position: "right",
            labels: {
              // Set the backgroundColor for each legend item to match level 1 background color
              generateLabels: function(chart) {
                let data = chart.data;
                const color_selector = data.datasets.length - 1;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map(function(label, i) {
                    return {
                      text: label,
                      fillStyle: data.datasets[color_selector].backgroundColor[i], // Using level 1 background color
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          }
        }
      }
    };
  
    let ctx = document.getElementById(elemnt_id).getContext("2d"); // Get the canvas element
    // Destroy the existing Chart object if it exists
    if (Chart.getChart(ctx)) {
      Chart.getChart(ctx).destroy();
    }
    // render the chart
    const myChart = new Chart(ctx, config);
  }