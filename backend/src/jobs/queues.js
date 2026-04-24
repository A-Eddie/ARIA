// src/jobs/queues.js  — Bull background job queues
let evaluationQueue = null;

try {
  const Bull = require("bull");
  evaluationQueue = new Bull("evaluation", {
    redis: process.env.REDIS_URL || "redis://localhost:6379",
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail:     50,
    },
  });

  // Process evaluation jobs
  evaluationQueue.process(async (job) => {
    const { interviewId, candidateId } = job.data;
    console.log(`[Queue] Running evaluation for candidate ${candidateId}`);
    const { runEvaluation } = require("../routes/evaluation");
    const result = await runEvaluation(interviewId, candidateId);
    console.log(`[Queue] Evaluation complete — score: ${result.evaluation.score}`);
    return result;
  });

  evaluationQueue.on("failed", (job, err) => {
    console.error(`[Queue] Evaluation job failed: ${job.id}`, err.message);
  });

  evaluationQueue.on("completed", (job) => {
    console.log(`[Queue] Job ${job.id} completed successfully`);
  });

  console.log("✅ Bull queue connected");
} catch (err) {
  console.warn("⚠️  Redis/Bull not available — evaluations will run synchronously");
}

module.exports = { evaluationQueue };
