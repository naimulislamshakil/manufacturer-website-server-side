const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verify = require("jsonwebtoken/verify");
require("dotenv").config();
const port = process.env.PORT || 5000;

// madelware
app.use(cors());
app.use(express.json());

//
// laptop_manu

const uri = `mongodb+srv://${process.env.DB_ACCESS_USERNAME}:${process.env.DB_ACCESS_PASS}@cluster0.z5hwi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
console.log("db connect");

async function run() {
  try {
    await client.connect();

    const productCollaction = client
      .db("laptop_manufaction")
      .collection("product");

    app.get("/product", async (req, res) => {
      const result = await productCollaction.find().toArray();
      res.send(result);
    });
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("How Are You?");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
