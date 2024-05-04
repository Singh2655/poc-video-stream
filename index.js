import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import multer from "multer";
import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { error } from "console";
import { stderr, stdout } from "process";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000","http://localhost:5173"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Header", "*");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.json({ message: "Hello world" });
});

app.post("/upload", upload.single("file"), (req, res) => {
  const lessionId = uuidv4();
  const videoPath = req.file.path;
  const outputPath = `./uploads/courses/${lessionId}`;
  const hlsPath = `${outputPath}/index.m3u8`;
  console.log("hlsPath", hlsPath);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}

    `;

    exec(ffmpegCommand,(error,stdout,stderr)=>{
        if(error){
            console.log(`exec error: ${error}`)
        }
        console.log("stdout",stdout)
        console.log("stderr",stderr)
        const videoUrl=`http://localhost:8080/uploads/courses/${lessionId}/index.m3u8`

        res.json({
            message:"converted data to Hls format",
            videoUrl:videoUrl,
            lessionId:lessionId,
        })
    })
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});
