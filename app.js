const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbpath = path.join(__dirname, "covid19India.db");

app.use(express.json());
let db = null;

const IntilizeDbObjectAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Started");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
    process.exit(1);
  }
};
IntilizeDbObjectAndServer();

const convertDbObjectToResponseObject = (dbobject) => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  };
};

//API 1
app.get("/states/", async (require, response) => {
  const getAllStates = `
    SELECT * FROM state
    `;
  const stateArray = await db.all(getAllStates);
  response.send(
    stateArray.map((each) => convertDbObjectToResponseObject(each))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
    SELECT * FROM state
    WHERE state_id = ${stateId}
    `;
  const singlestate = await db.get(getState);
  response.send(convertDbObjectToResponseObject(singlestate));
});

// API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
    INSERT INTO district (district_name , state_id , cases , cured , active , deaths)
    VALUES ('${districtName}' , ${stateId} , ${cases} , ${cured} , 
    ${active} , ${deaths}
    )
    `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ${districtId}
    `;
  const name = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(name));
});

// API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId}
    `;
  await db.run(deleteQuery);
  response.send("District Removed");
});
// API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
  UPDATE district SET 
  district_name = '${districtName}',
  state_id = ${stateId},
   cases = ${cases}, 
  cured = ${cured},
   active =${active} ,
  deaths = ${deaths}
  WHERE district_id = ${districtId}
  `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
    WHERE state_id = ${stateId}
    `;
  const stats = await db.get(getStateQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateId = `
  select state_id from district where
  district_id = ${districtId}
  `;
  const stateId = await db.get(getStateId);

  const getStateName = `
  select state_name as stateName from state
  where state_id = ${stateId.state_id}
  `;
  const finalName = await db.get(getStateName);
  console.log(finalName);
  response.send(finalName);
});

module.exports = app;
