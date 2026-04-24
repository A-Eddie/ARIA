// src/routes/reports.js
const express = require("express");
const { db, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();
router.use(verifyToken);

router.get("/summary", async (req, res, next) => {
  try {
    const [candSnap, jobSnap, compSnap] = await Promise.all([
      db.collection(Collections.CANDIDATES).where("companyId","==",req.companyId).get(),
      db.collection(Collections.JOBS).where("companyId","==",req.companyId).get(),
      db.collection(Collections.COMPANIES).doc(req.companyId).get(),
    ]);
    const candidates = candSnap.docs.map(d => d.data());
    const jobs       = jobSnap.docs.map(d => d.data());
    const company    = compSnap.data();
    const scored     = candidates.filter(c => c.score !== null);
    const avgScore   = scored.length ? Math.round(scored.reduce((a,c) => a+c.score,0)/scored.length) : 0;
    const byStatus   = {};
    candidates.forEach(c => { byStatus[c.status] = (byStatus[c.status]||0)+1; });
    const byVerdict  = {};
    candidates.filter(c=>c.verdict).forEach(c => { byVerdict[c.verdict] = (byVerdict[c.verdict]||0)+1; });
    const byRole = {};
    candidates.forEach(c => {
      if (!byRole[c.role]) byRole[c.role] = { count:0, totalScore:0, scored:0 };
      byRole[c.role].count++;
      if (c.score) { byRole[c.role].totalScore += c.score; byRole[c.role].scored++; }
    });
    const roleStats = Object.entries(byRole).map(([role,d]) => ({
      role, count: d.count,
      avgScore: d.scored ? Math.round(d.totalScore/d.scored) : null,
    }));
    res.json({
      summary: {
        totalCandidates: candidates.length,
        openJobs:        jobs.filter(j=>j.status==="open").length,
        totalJobs:       jobs.length,
        hired:           byStatus.hired||0,
        hireRate:        candidates.length ? Math.round(((byStatus.hired||0)/candidates.length)*100) : 0,
        avgScore,
        interviewsUsed:  company.interviewsUsed,
        interviewsLimit: company.interviewsLimit,
        byStatus,
        byVerdict,
        roleStats,
      }
    });
  } catch(err){next(err);}
});

module.exports = router;
