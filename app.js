const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
 SELECT
 *
 FROM
 state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

// get one state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getOneStateQuery = `
    SELECT
      *
    FROM
    state 
    WHERE
      state_id = ${stateId};`;
  const state = await db.get(getOneStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

// add states

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
    district ( 
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths)
    VALUES
      (
         '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
         
      );`;

  const dbResponse = await db.run(addDistrictQuery);
  const addId = dbResponse.lastID;
  response.send("District Successfully Added");
});

