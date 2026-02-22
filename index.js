const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const RELEASE_STEPS = [
    "Code Freeze",
    "Run Unit Tests",
    "QA Validation",
    "Security Review",
    "Performance Testing",
    "Prepare Release Notes",
    "Deploy to Production",
    "Post Deployment Testing"
];

function computeStatus(steps) {
    const completed = steps.filter(Boolean).length;
    if (completed === 0) return "planned";
    if (completed === steps.length) return "done";
    return "ongoing";
}

/* GET ALL RELEASES */
app.get("/api/releases", async (req, res) => {
    const releases = await prisma.release.findMany({
        orderBy: { createdAt: "desc" }
    });

    const withStatus = releases.map(r => ({
        ...r,
        status: computeStatus(r.steps)
    }));

    res.json(withStatus);
});

/* CREATE RELEASE */
app.post("/api/releases", async (req, res) => {
    const { name, dueDate, additionalInfo } = req.body;

    const newRelease = await prisma.release.create({
        data: {
            name,
            dueDate: new Date(dueDate),
            additionalInfo,
            steps: Array(RELEASE_STEPS.length).fill(false)
        }
    });

    res.json(newRelease);
});

/* UPDATE STEPS */
app.patch("/api/releases/:id/steps", async (req, res) => {
    const { steps } = req.body;

    const updated = await prisma.release.update({
        where: { id: req.params.id },
        data: { steps }
    });

    res.json(updated);
});

/* UPDATE INFO */
app.patch("/api/releases/:id/info", async (req, res) => {
    const { additionalInfo } = req.body;

    const updated = await prisma.release.update({
        where: { id: req.params.id },
        data: { additionalInfo }
    });

    res.json(updated);
    // navigate("/");
});

///delete release
app.delete("/api/releases/:id", async (req, res) => {
    await prisma.release.delete({
        where: { id: req.params.id }
    });
    res.json({ message: "Deleted successfully" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));