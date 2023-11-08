const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: ["https://jobfinderbd.netlify.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8sb7n8j.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const logger = (req, res, next) => {
  console.log("log: info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function setupServer() {
  try {
    console.log("Connected to MongoDB");

    const AllJobsCollection = client.db("jobFinderDB").collection("allJobs");
    const AllApplyJobsCollection = client
      .db("jobFinderDB")
      .collection("applyJobs");
    // auth related api
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.get("/allJobs", async (req, res) => {
      const cursor = AllJobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.put("/jobUpdate/:id", async (req, res) => {
      const id = req.params.id;
      console.log(req.cookies);
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

    app.get("/myJobs", logger, verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email };
      }
      const cursor = AllJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/myAppliedJobs", logger, verifyToken, async (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email };
      }
      const cursor = AllApplyJobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/updateJobApplicants/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await AllJobsCollection.findOne(query);
      job.jobApplicantsNumber += 1;
      const result = await AllJobsCollection.updateOne(query, { $set: job });
      res.send(result);
      console.log(result);
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
