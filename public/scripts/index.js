
//importing funcitons
import { populateSelectOptions } from "/scripts/rendering.js";
import { populateAnalysis } from "/scripts/rendering.js";


// Defining some variables 
export let analysis_selector = [];
export let analysis_view = [];
export let analysis_id = [
  "first_destination",
  "top_employers",
  "starting_salary",
  "top_universities",
  "degree_types",
  "fields_of_study",
];
export let selected_choices = {};
export let selected_analysis;
export let selected_view;

// Identifying select elements
const selectElements = document.querySelectorAll(
  'select[name="year"], select[name="school"], select[name="major"]'
);

// Identifying analysis_selector
for (let i = 0; i < 6; i++) {
  analysis_selector.push(document.getElementById(analysis_id[i]));
  analysis_view.push(document.getElementById(analysis_id[i] + "_view"));
}

// Initial value of selected elements
selected_analysis = analysis_selector[0];
selected_view = analysis_view[0];

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", async function () {
  selected_choices = await populateSelectOptions("page_load", selected_choices);
  await populateAnalysis(selected_analysis);
});

// Assigning Event Listener to select elements
selectElements.forEach((select) => {
  select.addEventListener("change", async function () {
    selected_choices = await populateSelectOptions(select.name, selected_choices);
    await populateAnalysis(selected_analysis);
  });
});

// Asssigning Event Listener to each of them
for (let i = 0; i < 6; i++) {
  analysis_selector[i].addEventListener("click", async function () {
    if (analysis_selector[i] != selected_analysis) {
      // console.log("event listener for: ", analysis_selector[i].id);
      // console.log("selected analysis is: ", selected_analysis.id);

      selected_view.classList.remove("selected");
      selected_analysis.classList.remove("selected");

      selected_view = analysis_view[i];
      selected_analysis = analysis_selector[i];

      selected_view.classList.add("selected");
      selected_analysis.classList.add("selected");

      await populateAnalysis(selected_analysis);
    }
  });
}
