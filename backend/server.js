const express = require("express");
const cors = require("cors");
const mainRouter = require("./routes/mainRoute")

const PORT = 3000;
const app = express();

app.use(express.json())
app.use(cors())

app.get("/test", (req, res) => {
  return res.json({
    message: "hello world",
  });
});

app.use("/api", mainRouter)

app.listen(PORT, ()=>{
    console.log(`Backend server is running at: http://localhost:${PORT}`)
})