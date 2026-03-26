// ==============================================================================
// AI Controller — Pure Local Logic (No Python AI engine dependency)
// Only the Ishaa V2 proxy calls the Python FastAPI server.
// Dashboard metrics (persona, mastery, exam) use local formulas.
// ==============================================================================

const UserActivity = require('../../models/UserActivity.model');
const UserProfile = require('../../models/UserProfile.model');
const UserProgress = require('../../models/UserProgress.model');
const Chapter = require('../../models/Chapter.model');
const axios = require('axios'); // Only used by Ishaa V2 proxy
const mongoose = require('mongoose');
const cacheService = require('../../services/cache.service');

const getDifficultyWeight = (level) => {
    if (level === 'Hard') return 3;
    if (level === 'Medium') return 2;
    return 1;
};

// --- COMBINED DASHBOARD (Single call, pure local math) ---
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const metrics = await calculateCommonMetrics(userId);

        const masteryScore = (
            metrics.accuracy_rate * 0.4 +
            metrics.difficulty_weighted_score * 0.3 +
            metrics.consistency_index * 0.3
        ) * 100;

        const streakBonus = Math.min(metrics.streak * 0.5, 5);
        const predictedScore = Math.min(100,
            masteryScore * 0.6 +
            metrics.syllabus_completion * 0.35 +
            streakBonus
        );

        let persona = 'Learner';
        if (metrics.accuracy_rate > 0.8 && metrics.consistency_index > 0.7) persona = 'Master';
        else if (metrics.accuracy_rate > 0.7) persona = 'Strategist';
        else if (metrics.difficulty_weighted_score > 0.6) persona = 'Challenger';
        else if (metrics.consistency_index > 0.8) persona = 'Steady Grinder';

        const levelLabel = masteryScore > 85 ? "Grandmaster" : masteryScore > 70 ? "Expert" : masteryScore > 50 ? "Apprentice" : "Novice";

        res.status(200).json({
            success: true,
            persona: { success: true, persona },
            mastery: {
                success: true,
                mastery_score: masteryScore.toFixed(1),
                level: levelLabel,
                ai_data: { time_efficiency_ratio: metrics.time_efficiency_ratio }
            },
            exam: {
                success: true,
                predicted_score: predictedScore.toFixed(1),
                syllabus_completion: metrics.syllabus_completion.toFixed(1)
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(500).json({ success: false, message: "Dashboard load failed" });
    }
};

// ==============================================================================
// HELPER: Common Metrics Calculation (Cached 5 min)
// ==============================================================================
async function calculateCommonMetrics(userId) {
    const cacheKey = `ai:metrics:${userId}`;
    try {
        const cached = await cacheService.get(cacheKey);
        if (cached) return cached;
    } catch (e) { /* Redis down, continue without cache */ }

    const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const stringId = userId.toString();

    const userProfile = await UserProfile.findById(objectId) || {};
    const streak = userProfile?.gamification?.streak || 0;

    const lastActive = userProfile?.gamification?.last_active_date
        ? new Date(userProfile.gamification.last_active_date)
        : new Date();
    const days_since_last_active = (new Date() - lastActive) / (1000 * 60 * 60 * 24);

    const totalChapters = await Chapter.countDocuments() || 1;
    const completedChapters = await UserProgress.countDocuments({
        user_id: stringId,
        'progress.percentage': 100
    });
    const syllabus_completion = (completedChapters / totalChapters) * 100;

    const activities = await UserActivity.aggregate([
        { $match: { user_id: stringId } },
        { $sort: { timestamp: -1 } },
        { $limit: 200 },
        {
            $lookup: {
                from: 'questions',
                let: { qId: { $toObjectId: "$question_id" } },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$qId"] } } },
                    { $project: { difficulty: 1, cognitive_level: 1, optimum_time: 1 } }
                ],
                as: 'q'
            }
        },
        { $unwind: "$q" }
    ]);

    if (activities.length === 0) {
        return {
            accuracy_rate: 0, difficulty_weighted_score: 0, time_efficiency_ratio: 1,
            cognitive_dropoff: 0, consistency_index: 0, days_since_last_active: 0,
            streak: 0, mastery_score: "0.0", syllabus_completion: 0,
            predicted_score: "0.0", persona: "Novice"
        };
    }

    let totalWeighted = 0, totalMax = 0, totalTimeRatio = 0, correctCount = 0;
    let remAcc = { c: 0, t: 0 }, anaAcc = { c: 0, t: 0 };

    const recent = activities.slice(0, 20).map(a => a.is_correct ? 1 : 0);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
    const consistency_index = 1 - Math.sqrt(variance);

    activities.forEach(act => {
        const w = getDifficultyWeight(act.q.difficulty);
        if (act.is_correct) { correctCount++; totalWeighted += w; }
        totalMax += w;
        totalTimeRatio += (act.time_taken / (act.q.optimum_time || 60));

        if (act.q.cognitive_level === 'Remember') { remAcc.t++; if (act.is_correct) remAcc.c++; }
        if (act.q.cognitive_level === 'Analyze') { anaAcc.t++; if (act.is_correct) anaAcc.c++; }
    });

    const remRate = remAcc.t > 0 ? remAcc.c / remAcc.t : 0;
    const anaRate = anaAcc.t > 0 ? anaAcc.c / anaAcc.t : 0;
    const accuracy_rate = correctCount / activities.length;
    const mastery_score = totalMax > 0 ? (totalWeighted / totalMax) * 100 : 0;

    const result = {
        accuracy_rate,
        difficulty_weighted_score: totalMax > 0 ? totalWeighted / totalMax : 0,
        time_efficiency_ratio: totalTimeRatio / activities.length,
        cognitive_dropoff: Math.max(0, remRate - anaRate),
        consistency_index,
        days_since_last_active,
        streak,
        mastery_score: mastery_score.toFixed(1),
        syllabus_completion,
        predicted_score: (mastery_score * 0.7 + syllabus_completion * 0.3).toFixed(1),
        persona: accuracy_rate > 0.7 ? "Master" : "Learner"
    };

    try { await cacheService.set(cacheKey, result, 300); } catch (e) { /* Redis down */ }

    return result;
}

// ==============================================================================
// Ishaa V2 Proxy — Forwards to Python FastAPI for real LLM features
// This is the ONLY function that calls the Python server.
// ==============================================================================
const getIshaaV2Response = async (req, res) => {
    try {
        const endpointPath = req.params[0] || '';
        const ishaaV2Url = `${process.env.ISHAA_V2_API_URL}/${endpointPath}`;

        let authHeader = req.headers.authorization || '';
        if (!authHeader && req.cookies && req.cookies.jwt) {
            authHeader = `Bearer ${req.cookies.jwt}`;
        } else if (authHeader && !authHeader.startsWith('Bearer ')) {
            authHeader = `Bearer ${authHeader}`;
        }

        const response = await axios({
            method: req.method,
            url: ishaaV2Url,
            data: req.body,
            params: req.query,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error communicating with Ishaa V2:", error.message);

        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ error: "Failed to connect to AI Engine Phase 2" });
    }
};

exports.getIshaaV2Response = getIshaaV2Response;
