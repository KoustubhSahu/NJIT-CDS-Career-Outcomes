import express, { query, request } from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import { getDatabaseData } from "./dbConnect.js";
import pg from "pg";

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
//// Get the current file path
const __filename = fileURLToPath(import.meta.url);
//// Get the directory path
const __dirname = dirname(__filename);
//// Serve static files from the "public" directory
// app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(("public")));
app.use(express.json());


const db_config = {
  user: "postgres",
  host: "localhost",
  database: "njit",
  password: "Password@23",
  port: 5432,
};

let analysis_id = [
  "first_destination",
  "top_employers",
  "starting_salary",
  "top_universities",
  "degree_types",
  "fields_of_study",
];

async function getDatabaseData(sql_query) {
  let db = new pg.Client(db_config);
  try {
    await db.connect();
    const result = await db.query(sql_query);
    return result.rows;
  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await db.end();
  }
}

let choices = {
  year: [],
  school: [],
  major: [],
};

let current_choices = { year: "all", school: "all", major: "all" };
let selected_analysis = analysis_id[0];

let column_names = { year: "class_of", school: "school", major: "major" };

// Get the choices from database based on the selection
async function getChoices(selected_choices) {
  let previous_check = {
    year: { is_all: true },
    school: {
      is_all: selected_choices.year == "all",
      column: { year: "class_of" },
    },
    major: {
      is_all:
        selected_choices.year == "all" && selected_choices.school == "all",
      column: { year: "class_of", school: "school" },
    },
  };
  let select_all_name = {
    year: "All Years",
    school: "All School",
    major: "All Major",
  };

  for (let key in selected_choices) {
    let db_data_object = {};

    if (previous_check[key].is_all) {
      db_data_object = await getDatabaseData(
        `SELECT DISTINCT ${column_names[key]} FROM career_outcomes ORDER BY ${column_names[key]} `
      );
    } else {
      let where_query = `SELECT DISTINCT ${column_names[key]} FROM career_outcomes `;
      for (let prev_key in previous_check[key].column) {
        if (selected_choices[prev_key] != "all") {
          where_query += where_query.includes("WHERE")
            ? ` AND ${previous_check[key].column[prev_key]} = '${selected_choices[prev_key]}'`
            : ` WHERE ${previous_check[key].column[prev_key]} = '${selected_choices[prev_key]}'`;
        }
      }
      where_query += `ORDER BY ${column_names[key]} `;
      db_data_object = await getDatabaseData(where_query);
    }
    choices[key] = [select_all_name[key]].concat(
      db_data_object.map((obj) => Object.values(obj)[0])
    );
    //  If the selectd choise is not in the current list of choice, change it to all
    if (
      selected_choices[key] != "all" &&
      choices[key].includes(selected_choices[key])
    ) {
      current_choices[key] = selected_choices[key];
    } else {
      current_choices[key] = "all";
    }
  }
}

// Get the analysis data :
async function getAnalysisData() {
  let analysis_queries = {
    first_destination: [
      "SELECT outcome, count(*) AS count FROM career_outcomes ",
      " GROUP BY outcome",
    ],
    top_employers: [
      "SELECT employer, employer_count FROM ( SELECT employer, COUNT(employer) AS employer_count FROM career_outcomes ",
      `  GROUP BY employer ) AS employer_counts WHERE employer IS NOT NULL ORDER BY employer_count DESC `,
    ],
    starting_salary: [
      "SELECT AVG(salary) AS average_salary, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary, MAX(salary) AS max_salary FROM ( SELECT salary FROM career_outcomes WHERE salary > 40000 ",
      " ) AS above_40k_salary",
    ],
    top_universities: [
      "SELECT cont_edu, cont_edu_count FROM ( SELECT cont_edu, COUNT(cont_edu) AS cont_edu_count FROM career_outcomes ",
      `  GROUP BY cont_edu ) AS cont_edu_counts WHERE cont_edu IS NOT NULL ORDER BY cont_edu_count DESC `,
    ],
    degree_types: [
      "SELECT cont_edu_degree, count(*) AS count FROM career_outcomes WHERE cont_edu_degree IS NOT NULL ",
      " GROUP BY cont_edu_degree ORDER BY count DESC",
    ],
    fields_of_study: [
      "SELECT cont_edu_field, count(*) AS count FROM career_outcomes WHERE cont_edu_field IS NOT NULL ",
      " GROUP BY cont_edu_field ORDER BY count DESC",
    ],
  };

  let analysis_query = "";
  let where_condition = "";

  if (analysis_queries[selected_analysis][0].includes("WHERE")) {
    for (let key in current_choices) {
      if (current_choices[key] != "all") {
        where_condition +=
          " AND " + column_names[key] + " = '" + current_choices[key] + "' ";
      }
    }
  } else {
    for (let key in current_choices) {
      if (current_choices[key] != "all") {
        where_condition += where_condition == "" ? " WHERE " : " AND ";
        where_condition +=
          column_names[key] + " = '" + current_choices[key] + "' ";
      }
    }
  }

  analysis_query =
    analysis_queries[selected_analysis][0] +
    where_condition +
    analysis_queries[selected_analysis][1];
  return getDatabaseData(analysis_query);
}


// GET home page
app.get("/", async (req, res) => {
  res.render("index.ejs");
});

// Post method to handle the request to update the select choices
app.post("/update/select", async (req, res) => {
  let selected_choises = req.body.selected_choices;
  await getChoices(selected_choises);
  res.json({
    title: "Updated Choises",
    current_choices: current_choices,
    choices: choices,
  });
});

app.post("/update/analysis", async (req, res) => {
  selected_analysis = req.body.selected_analysis;
  console.log(`Selected analysis is ${selected_analysis}`);
  let analysis_data = await getAnalysisData();
  console.log(analysis_data);
  res.json({ title: "Analysis Data", analysis_data: analysis_data });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
