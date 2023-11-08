const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: 'http://localhost:5173' 
}));
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
    const AllApplyJobsCollection = client.db("jobFinderDB").collection("applyJobs");

    app.get("/allJobs", async (req, res) => {
      const cursor = AllJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.put("/jobUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateJob = req.body;
      const newProduct = {
        $set: {
          pictureUrl: updateJob.pictureUrl,
          jobTitle: updateJob.jobTitle,
          name: updateJob.name,
          userEmail: updateJob.userEmail,
          jobCategory: updateJob.jobCategory,
          salaryRange: updateJob.salaryRange,
          userImage: updateJob.userImage,
          jobDescription: updateJob.jobDescription,
          jobPostingDate: updateJob.jobPostingDate,
          applicationDeadline: updateJob.applicationDeadline,
          jobApplicantsNumber: updateJob.jobApplicantsNumber,
        },
      };
      const result = await AllJobsCollection.updateOne(
        filter,
        newProduct,
        options
      );
      res.send(result);
    });

    app.get("/jobDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllJobsCollection.findOne(query);
      res.send(result);
    });

    app.post("/alljobs", async (req, res) => {
      const newJobs = req.body;
      const result = await AllJobsCollection.insertOne(newJobs);
      res.send(result);
    });
    app.post("/applyJob", async (req, res) => {
      const applyJob = req.body;
      const result = await AllApplyJobsCollection.insertOne(applyJob);
      res.send(result);
    });

    app.get("/myJobs", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email };
      }
      const cursor = AllJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/myJobs/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllJobsCollection.deleteOne(query);
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
