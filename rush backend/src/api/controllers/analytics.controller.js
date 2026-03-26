const UserActivity = require('../../models/UserActivity.model');
const Question = require('../../models/Question.model');
const mongoose = require('mongoose');
const { catchAsync } = require('../../utils/apiError');
const UserProfile = require('../../models/UserProfile.model');

exports.getBoardTrend = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dateBoundary = new Date(today.getTime() - (48 * 24 * 60 * 60 * 1000));

    const trend = await UserActivity.aggregate([
      {
        $match: {
          user_id: userId,
          timestamp: { $gte: dateBoundary }
        }
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$timestamp" },
            week: { $isoWeek: "$timestamp" }
          },
          weekStart: { $min: "$timestamp" },
          averageAccuracy: { $avg: { $cond: ["$is_correct", 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      { $limit: 7 }
    ]);

    const formattedData = trend.map((t, index) => ({
      weekLabel: `W${index + 1}`,
      date: t.weekStart.toISOString().split('T')[0],
      probability: Math.round(t.averageAccuracy * 100)
    }));

    res.status(200).json({
      status: 'success',
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopicDiagnostics = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const diagnostics = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: "$topic_tag",
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ["$is_correct", 1, 0] } },
          avgTimeTaken: { $avg: "$time_taken" }
        }
      },
      {
        $project: {
          topic: "$_id",
          accuracy: { $multiply: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 100] },
          timeTaken: "$avgTimeTaken",
          status: {
            $switch: {
              branches: [
                { case: { $gte: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 0.8] }, then: "Mastered" },
                { case: { $gte: [{ $divide: ["$correctAttempts", "$totalAttempts"] }, 0.5] }, then: "Improving" }
              ],
              default: "Weak"
            }
          }
        }
      }
    ]);

    res.status(200).json({ status: 'success', data: diagnostics });
  } catch (error) {
    next(error);
  }
};

exports.getCognitiveSkills = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const skills = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      { $addFields: { qIdObj: { $toObjectId: "$question_id" } } },
      {
        $lookup: {
          from: "questions",
          localField: "qIdObj",
          foreignField: "_id",
          as: "questionDetails"
        }
      },
      { $unwind: { path: "$questionDetails", preserveNullAndEmptyArrays: false } },
      // Map cognitive_level — fallback to difficulty-based inference if missing
      {
        $addFields: {
          resolvedCognitive: {
            $ifNull: [
              "$questionDetails.cognitive_level",
              {
                $switch: {
                  branches: [
                    { case: { $eq: ["$questionDetails.difficulty", "Easy"] }, then: "Remember" },
                    { case: { $eq: ["$questionDetails.difficulty", "Medium"] }, then: "Apply" },
                    { case: { $eq: ["$questionDetails.difficulty", "Hard"] }, then: "Analyze" }
                  ],
                  default: "Understand"
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$resolvedCognitive",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$is_correct", 1, 0] } }
        }
      },
      {
        $project: {
          skill: "$_id",
          percentage: { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] }
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    // Ensure all 4 Bloom's levels are represented (fill missing ones with 0%)
    const BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze"];
    const skillMap = new Map(skills.map(s => [s.skill, s.percentage]));
    const fullSkills = BLOOM_LEVELS.map(level => ({
      skill: level,
      percentage: skillMap.get(level) || 0
    }));

    res.status(200).json({ status: 'success', data: fullSkills });
  } catch (error) {
    next(error);
  }
};

exports.getRootCause = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // 1. Behavioral Analysis (Time/Pattern Heuristics)
    const analysis = await UserActivity.aggregate([
      { $match: { user_id: userId, is_correct: false } },
      {
        $project: {
          category: {
            $switch: {
              branches: [
                { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
                { case: { $and: [{ $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] }] }, then: "Silly Mistake" },
                { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
              ],
              default: "Conceptual Error"
            }
          }
        }
      },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const totalErrors = analysis.reduce((sum, item) => sum + item.count, 0);
    const colorMap = {
      'Conceptual Error': '#EF4444',
      'Silly Mistake': '#F59E0B',
      'Time Management': '#3B82F6',
      'Guessing': '#10B981'
    };

    const items = analysis.map(item => ({
      label: item._id,
      count: item.count,
      percentage: totalErrors > 0 ? Math.round((item.count / totalErrors) * 100) : 0,
      color: colorMap[item._id] || '#9CA3AF'
    }));

    // 2. Topic Dependency Analysis — find weakest topic's prerequisites
    let dependencyData = null;
    const weakTopicStats = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      { $group: { _id: "$topic_tag", accuracy: { $avg: { $cond: ["$is_correct", 1, 0] } } } },
      { $sort: { accuracy: 1 } },
      { $limit: 1 }
    ]);

    if (weakTopicStats.length > 0) {
      const weakTopicName = weakTopicStats[0]._id;
      const dependencies = await Question.aggregate([
        { $match: { "topic.name": weakTopicName } },
        { $unwind: { path: "$prerequisites", preserveNullAndEmptyArrays: false } },
        { $group: { _id: "$prerequisites.topic", strength_req: { $first: "$prerequisites.strength_req" } } },
        { $limit: 3 }
      ]);

      dependencyData = {
        weakestTopic: weakTopicName,
        accuracy: Math.round(weakTopicStats[0].accuracy * 100),
        prerequisites: dependencies.map(d => ({ name: d._id, impact: d.strength_req }))
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalErrors,
        items: items.length > 0 ? items : [],
        topicAnalysis: dependencyData
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getRetentionHealth = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const RETENTION_GAP_MS = 3 * 24 * 60 * 60 * 1000;

    const retentionStats = await UserActivity.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: "$topic_tag",
          firstSeen: { $min: "$timestamp" },
          attempts: {
            $push: {
              is_correct: "$is_correct",
              timestamp: "$timestamp"
            }
          }
        }
      },
      {
        $project: {
          retentionAttempts: {
            $filter: {
              input: "$attempts",
              as: "attempt",
              cond: {
                $gte: [
                  "$$attempt.timestamp",
                  { $add: ["$firstSeen", RETENTION_GAP_MS] }
                ]
              }
            }
          }
        }
      },
      { $match: { "retentionAttempts.0": { $exists: true } } },
      { $unwind: "$retentionAttempts" },
      {
        $group: {
          _id: null,
          totalCorrect: { $sum: { $cond: ["$retentionAttempts.is_correct", 1, 0] } },
          totalAttempts: { $sum: 1 }
        }
      }
    ]);

    if (retentionStats.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          overallRetention: 0,
          hasData: false,
          healthStatus: "Calculating...",
          insight: "Keep practicing! We need activity older than 3 days to measure retention."
        }
      });
    }

    const stats = retentionStats[0];
    const percentage = Math.round((stats.totalCorrect / stats.totalAttempts) * 100);

    let status = "Weak";
    let insight = "Your retention is critical. Review older topics frequently.";

    if (percentage >= 80) {
      status = "Excellent";
      insight = "Great long-term memory! You are retaining concepts well.";
    } else if (percentage >= 50) {
      status = "Good";
      insight = "You retain most concepts, but regular revision will help.";
    }

    res.status(200).json({
      status: 'success',
      data: {
        overallRetention: percentage,
        hasData: true,
        healthStatus: status,
        insight
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getChapterAnalysis = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const analysis = await UserActivity.aggregate([
      { $match: { user_id: userId } },

      // Lookup Question — safe: skip activities with deleted questions
      { $addFields: { qIdObj: { $toObjectId: "$question_id" } } },
      {
        $lookup: {
          from: "questions",
          localField: "qIdObj",
          foreignField: "_id",
          as: "q"
        }
      },
      { $unwind: { path: "$q", preserveNullAndEmptyArrays: false } },

      // Lookup Topic — safe: skip if topic FK broken
      {
        $lookup: {
          from: "Global_Topics",
          localField: "q.topic_id",
          foreignField: "_id",
          as: "t"
        }
      },
      { $unwind: { path: "$t", preserveNullAndEmptyArrays: false } },

      // Lookup Chapter — safe: skip if chapter FK broken
      {
        $lookup: {
          from: "Global_Chapters",
          localField: "t.chapter_id",
          foreignField: "_id",
          as: "c"
        }
      },
      { $unwind: { path: "$c", preserveNullAndEmptyArrays: false } },

      // Lookup Subject — safe: skip if subject FK broken
      {
        $lookup: {
          from: "Global_Subjects",
          localField: "c.subject_id",
          foreignField: "_id",
          as: "s"
        }
      },
      { $unwind: { path: "$s", preserveNullAndEmptyArrays: false } },

      // Calculate error type and time status
      {
        $addFields: {
          errorType: {
            $switch: {
              branches: [
                { case: { $eq: ["$is_correct", true] }, then: "None" },
                { case: { $lt: ["$time_taken", 5] }, then: "Guessing" },
                { case: { $and: [{ $gte: ["$time_taken", 5] }, { $lt: ["$time_taken", 15] }] }, then: "Silly Mistake" },
                { case: { $gt: ["$time_taken", 120] }, then: "Time Management" }
              ],
              default: "Conceptual Error"
            }
          },
          timeStatus: {
            $switch: {
              branches: [
                { case: { $lt: ["$time_taken", 10] }, then: "Rushing" },
                { case: { $gt: ["$time_taken", 90] }, then: "Overthinking" }
              ],
              default: "Optimal"
            }
          }
        }
      },

      // Group by Subject > Chapter > Topic
      {
        $group: {
          _id: { subject: "$s.name", chapter: "$c.name", topic: "$t.name" },
          topicTotal: { $sum: 1 },
          topicCorrect: { $sum: { $cond: ["$is_correct", 1, 0] } },
          errors: { $push: "$errorType" },
          timeStatuses: { $push: "$timeStatus" }
        }
      },

      // Aggregate by Subject + Chapter
      {
        $group: {
          _id: { subject: "$_id.subject", chapter: "$_id.chapter" },
          topics: {
            $push: {
              name: "$_id.topic",
              accuracy: { $multiply: [{ $divide: ["$topicCorrect", "$topicTotal"] }, 100] },
              count: "$topicTotal"
            }
          },
          allErrors: { $push: "$errors" },
          allTimeStatuses: { $push: "$timeStatuses" }
        }
      },

      // Final formatting
      {
        $project: {
          subjectName: "$_id.subject",
          _id: "$_id.chapter",
          topics: {
            $map: {
              input: "$topics",
              as: "t",
              in: {
                name: "$$t.name",
                accuracy: { $round: ["$$t.accuracy", 0] },
                count: "$$t.count"
              }
            }
          },
          rootCauses: {
            $reduce: {
              input: { $reduce: { input: "$allErrors", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
              initialValue: { Conceptual: 0, Silly: 0, Time: 0, Guessing: 0 },
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$$this", "Conceptual Error"] }, then: { Conceptual: { $add: ["$$value.Conceptual", 1] } } },
                        { case: { $eq: ["$$this", "Silly Mistake"] }, then: { Silly: { $add: ["$$value.Silly", 1] } } },
                        { case: { $eq: ["$$this", "Time Management"] }, then: { Time: { $add: ["$$value.Time", 1] } } },
                        { case: { $eq: ["$$this", "Guessing"] }, then: { Guessing: { $add: ["$$value.Guessing", 1] } } }
                      ],
                      default: {}
                    }
                  }
                ]
              }
            }
          },
          timeCounts: {
            $reduce: {
              input: { $reduce: { input: "$allTimeStatuses", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } },
              initialValue: { Rushing: 0, Overthinking: 0, Optimal: 0 },
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$$this", "Rushing"] }, then: { Rushing: { $add: ["$$value.Rushing", 1] } } },
                        { case: { $eq: ["$$this", "Overthinking"] }, then: { Overthinking: { $add: ["$$value.Overthinking", 1] } } },
                        { case: { $eq: ["$$this", "Optimal"] }, then: { Optimal: { $add: ["$$value.Optimal", 1] } } }
                      ],
                      default: {}
                    }
                  }
                ]
              }
            }
          }
        }
      },

      // Determine dominant time pressure status
      // Only flag Rushing/Overthinking if they exceed Optimal count
      {
        $addFields: {
          timePressureStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gt: ["$timeCounts.Rushing", "$timeCounts.Optimal"] },
                      { $gte: ["$timeCounts.Rushing", "$timeCounts.Overthinking"] }
                    ]
                  },
                  then: "Rushing"
                },
                {
                  case: {
                    $and: [
                      { $gt: ["$timeCounts.Overthinking", "$timeCounts.Optimal"] },
                      { $gt: ["$timeCounts.Overthinking", "$timeCounts.Rushing"] }
                    ]
                  },
                  then: "Overthinking"
                }
              ],
              default: "Normal"
            }
          }
        }
      },

      { $sort: { subjectName: 1, _id: 1 } }
    ]);

    res.status(200).json({ status: 'success', data: analysis });

  } catch (error) {
    next(error);
  }
};

exports.getDashboardPulse = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const user = await UserProfile.findById(userId)
    .select('ai_report topic_states gamification dashboard_insight profile.name');

  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'User profile not found' });
  }

  const readiness = (user.ai_report && user.ai_report.predicted_percentile) ? user.ai_report : {
    predicted_percentile: 0,
    probability_score: 0,
    reasoning: "Complete more sessions to activate AI predictions."
  };

  let recoveryQueue = (user.topic_states || [])
    .filter(t => t.memory_strength < 45)
    .sort((a, b) => a.memory_strength - b.memory_strength)
    .slice(0, 3);

  if (recoveryQueue.length === 0 && user.topic_states?.length > 0) {
    recoveryQueue = user.topic_states.slice(0, 3);
  }

  res.status(200).json({
    status: 'success',
    data: {
      userName: user.profile.name || "Student",
      readiness,
      stats: user.gamification || { streak: 0 },
      aiPlan: user.dashboard_insight?.recommendation || { label: "Analyze Path", context: "Pick a subject below to start your diagnostic." },
      recoveryQueue
    }
  });
});
