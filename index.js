const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8sb7n8j.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function setupServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const AllJobsCollection = client.db("jobFinderDB").collection("allJobs");

     app.get("/allJobs", async (req, res) => {
      const cursor = AllJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/jobDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllJobsCollection.findOne(query);
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("Job Finder server is running");
    });

    app.listen(port, () => {
      console.log(`Job Finder is running on port: ${port}`);
    });
  } catch (error) {
    console.error("Error setting up the server:", error);
  }
}

setupServer();
