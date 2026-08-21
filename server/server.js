const express = require("express");
const axios = require("axios");
const Redis = require("redis");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
  }),
);

const redisClient = Redis.createClient();

const DEFAULT_EXPIRATION = 3600;

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;
  const cacheKey = albumId ? `photos?albumId=${albumId}` : "photos";

  try {
    const cachedPhotos = await redisClient.get(cacheKey);

    if (cachedPhotos) {
      return res.json(JSON.parse(cachedPhotos));
    }

    console.log("Cache Miss");
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      {
        params: { albumId },
      },
    );

    await redisClient.setEx(cacheKey, DEFAULT_EXPIRATION, JSON.stringify(data));

    res.json(data);
  } catch (error) {
    console.error("Endpoint Error:", error);
    res.status(500).send("Server Error");
  }
});

async function startServer() {
  await redisClient.connect();
  console.log("Connected to Redis server");

  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer().catch(console.error);
