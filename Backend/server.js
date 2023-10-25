import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import connectMongoDB from "./db.js";
import user from "./user.js";
import uploadToDrive from "./uploadToDrive.js";

dotenv.config();

connectMongoDB();

const app = express();
const port = 3000;

const corsOptions = {
    origin: "*",
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const upload = multer({
    storage: multer.memoryStorage(),
});

app.post("/createUser", upload.any(), async (req, res) => {
    console.log(req.body);
    try {
        const existing = await user.findOne({ email: req.body.email });

        if (existing != null) {
            console.log("Email Already Registered");
            return res.status(403).send({
                success: "false",
                message: "Email Already Registered",
            });
        }

        const photoUploadResponse = await uploadToDrive(
            req.body.name,
            "Photo",
            req.files[0]
        );
        const resumeUploadResponse = await uploadToDrive(
            req.body.name,
            "Resume",
            req.files[1]
        );

        if (
            photoUploadResponse.status != 200 ||
            resumeUploadResponse.status != 200
        ) {
            return res.status(500).json({
                success: false,
                message: "Google Drive Upload Failed",
            });
        }

        let User = new user({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            branch: req.body.branch,
            reason: req.body.reason,
            yearOfStudy: "First Year",
            profileURL: photoUploadResponse.link,
            resumeURL: resumeUploadResponse.link,
        });

        await User.save();

        return res.status(201).json({
            success: true,
            message: "User Registered Successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Failed to submit!!! Try Again");
    }
});

app.get("/listOfUsers", async (req, res) => {
    const users = await user.find();
    res.send({ Users: users });
});

app.get("/count", async (req, res) => {
    const count = await user.find().count();
    res.send({ "No Of Users": count });
});

app.listen(port, () => {
    console.log(`Server app listening at ${port}`);
});
