const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress.model');
const UserActivity = require('../models/UserActivity.model');
const Topic = require('../models/Topic.model');
const Chapter = require('../models/Chapter.model');
const Subject = require('../models/Subject.model');
const cacheService = require('./cache.service');

const ADMIN_CONFIG = {
  MIN_SOLVED_HISTORY: 10,
  MIN_MISTAKE_SESSION_SIZE: 5,
  RECENCY_WINDOW_DAYS: 7,
  CACHE_TTL: 60
};

class DailyPlans {

  async generateDailyPlan(userId, subjectId = null) {
    const cacheKey = `daily-plan:${userId}:${subjectId || 'all'}`;
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    } catch (e) { /* Redis down */ }

    const totalSolved = await UserActivity.countDocuments({ user_id: userId });

    if (totalSolved < ADMIN_CONFIG.MIN_SOLVED_HISTORY) {
      const plan = await this.generateStarterPlan(totalSolved, subjectId);
      return this._cache(plan, cacheKey);
    }

    // --- Gather user stats ---
    const recentDateLimit = new Date();
    recentDateLimit.setDate(recentDateLimit.getDate() - ADMIN_CONFIG.RECENCY_WINDOW_DAYS);

    // Resolve subject → topic IDs + topic names for filtering
    let subjectTopicIds = null;
    let subjectTopicNames = null;
    if (subjectId) {
      const resolved = await this._resolveSubjectTopics(subjectId);
      subjectTopicIds = resolved.topicIds;
      subjectTopicNames = resolved.topicNames;
    }

    // Build activity filter — scope to subject's topics if selected
    const baseActivityFilter = { user_id: userId, timestamp: { $gte: recentDateLimit } };
    const wrongFilter = { ...baseActivityFilter, is_correct: false };
    if (subjectId && subjectTopicNames) {
      // Always apply filter when subject is selected — empty array = zero results (correct)
      const nameArray = [...subjectTopicNames];
      baseActivityFilter.topic_tag = { $in: nameArray };
      wrongFilter.topic_tag = { $in: nameArray };
    }

    const [wrongActivities, recentActivities, allProgress, totalSolvedForSubject] = await Promise.all([
      UserActivity.find(wrongFilter)
        .sort({ timestamp: -1 }).limit(50).select('question_id topic_tag'),

      UserActivity.find(baseActivityFilter)
        .select('is_correct topic_tag timestamp').lean(),

      UserProgress.find({
        user_id: userId,
        entity_type: 'topic'
      }).populate('entity_id', 'name chapter_id'),

      // Subject-level total solved count — always scope when subject selected
      subjectId && subjectTopicNames
        ? UserActivity.countDocuments({ user_id: userId, topic_tag: { $in: [...subjectTopicNames] } })
        : Promise.resolve(totalSolved)
    ]);

    // Filter progress by subject if needed
    const filteredProgress = subjectTopicIds
      ? allProgress.filter(p => p.entity_id && subjectTopicIds.has(p.entity_id._id.toString()))
      : allProgress;

    // Stats are now subject-scoped when a subject is selected
    const totalRecent = recentActivities.length;
    const correctRecent = recentActivities.filter(a => a.is_correct).length;
    const recentAccuracy = totalRecent > 0 ? Math.round((correctRecent / totalRecent) * 100) : 0;

    // Mistake review (also subject-scoped now)
    const uniqueWrongIds = [...new Set(wrongActivities.map(a => a.question_id.toString()))];
    const hasMistakeSession = uniqueWrongIds.length >= ADMIN_CONFIG.MIN_MISTAKE_SESSION_SIZE;

    // Bucket topics
    let warmUpCandidates = [];
    let deepWorkCandidates = [];
    let reviewCandidates = [];
    const now = new Date();

    if (hasMistakeSession) {
      deepWorkCandidates.push({
        topicId: 'mistake-session',
        topic: 'Mistake Review',
        note: `Retake ${uniqueWrongIds.length} questions you got wrong this week`,
        score: 9999,
        questionIds: uniqueWrongIds
      });
    }

    let strongestTopic = null;
    let weakestTopic = null;

    filteredProgress.forEach(p => {
      if (!p.entity_id || !p.entity_id._id) return;

      const daysSinceLast = (now - new Date(p.last_activity)) / (1000 * 60 * 60 * 24);
      const safeId = p.entity_id._id.toString();
      const topicName = p.entity_id.name;
      const progress = p.progress.percentage || 0;

      if (!strongestTopic || progress > strongestTopic.progress) {
        strongestTopic = { topic: topicName, progress };
      }
      if (!weakestTopic || (progress < weakestTopic.progress && progress > 0)) {
        weakestTopic = { topic: topicName, progress };
      }

      const topicData = { topicId: safeId, topic: topicName, progress };

      if (progress < 40) {
        deepWorkCandidates.push({ ...topicData, score: (100 - progress) * 2, note: `Only ${progress}% — needs focused practice` });
      } else if (progress < 60) {
        deepWorkCandidates.push({ ...topicData, score: (100 - progress) * 1.2, note: `${progress}% — almost there, push through` });
      } else if (progress >= 80) {
        warmUpCandidates.push({ ...topicData, score: progress, note: `${progress}% mastered — confidence builder` });
      } else if (daysSinceLast > 3) {
        reviewCandidates.push({ ...topicData, score: daysSinceLast * 10 + (80 - progress), note: `${Math.round(daysSinceLast)} days since last practice` });
      } else {
        warmUpCandidates.push({ ...topicData, score: progress * 0.8, note: `${progress}% — good progress` });
      }
    });

    deepWorkCandidates.sort((a, b) => b.score - a.score);
    warmUpCandidates.sort((a, b) => b.score - a.score);
    reviewCandidates.sort((a, b) => b.score - a.score);

    const plan = {
      warmup: warmUpCandidates[0] || { topicId: null, topic: 'General Quiz', note: 'Start with the basics' },
      deepWork: deepWorkCandidates[0] || { topicId: null, topic: 'New Topic', note: 'Ready to advance' },
      review: reviewCandidates[0] || { topicId: null, topic: 'None', note: 'All caught up!' },
      stats: {
        totalSolved: totalSolvedForSubject,
        recentAccuracy,
        questionsThisWeek: totalRecent,
        mistakesThisWeek: uniqueWrongIds.length,
        strongestTopic: strongestTopic ? strongestTopic.topic : null,
        strongestProgress: strongestTopic ? strongestTopic.progress : 0,
        weakestTopic: weakestTopic ? weakestTopic.topic : null,
        weakestProgress: weakestTopic ? weakestTopic.progress : 0,
        topicsTracked: filteredProgress.length
      }
    };

    return this._cache(plan, cacheKey);
  }

  // --- Starter plan: picks real topics from the selected subject ---
  async generateStarterPlan(totalSolved = 0, subjectId = null) {
    let topics = [];

    if (subjectId) {
      const resolved = await this._resolveSubjectTopics(subjectId);
      if (resolved.topicIds.size > 0) {
        topics = await Topic.find({ _id: { $in: [...resolved.topicIds] }, is_active: true })
          .sort({ order_index: 1 })
          .limit(5)
          .select('name _id')
          .lean();
      }
    }

    // Fallback: get any first topics
    if (topics.length === 0) {
      topics = await Topic.find({ is_active: true })
        .sort({ order_index: 1 })
        .limit(5)
        .select('name _id')
        .lean();
    }

    // Pick 3 different topics for warmup, deep work, review
    const warmupTopic = topics[0] || null;
    const deepTopic = topics[1] || topics[0] || null;
    const reviewTopic = topics[2] || null;

    return {
      warmup: warmupTopic
        ? { topicId: warmupTopic._id.toString(), topic: warmupTopic.name, note: 'Start here — easy intro' }
        : { topicId: null, topic: 'Welcome', note: 'No topics available yet' },
      deepWork: deepTopic
        ? { topicId: deepTopic._id.toString(), topic: deepTopic.name, note: 'Your first challenge' }
        : { topicId: null, topic: 'Getting Started', note: 'Begin your journey' },
      review: reviewTopic
        ? { topicId: reviewTopic._id.toString(), topic: reviewTopic.name, note: 'Preview this next' }
        : { topicId: null, topic: 'None', note: 'Solve more to unlock review' },
      stats: {
        totalSolved,
        recentAccuracy: 0,
        questionsThisWeek: 0,
        mistakesThisWeek: 0,
        strongestTopic: null,
        strongestProgress: 0,
        weakestTopic: null,
        weakestProgress: 0,
        topicsTracked: 0
      }
    };
  }

  // --- Resolve subject → chapter IDs → topic IDs + names ---
  async _resolveSubjectTopics(subjectId) {
    let subject;
    if (mongoose.Types.ObjectId.isValid(subjectId)) {
      subject = await Subject.findById(subjectId).select('_id').lean();
    }
    if (!subject) {
      subject = await Subject.findOne({ name: subjectId }).select('_id').lean();
    }

    if (!subject) return { chapterIds: [], topicIds: new Set(), topicNames: new Set() };

    const chapters = await Chapter.find({ subject_id: subject._id }).select('_id').lean();
    const chapterIds = chapters.map(c => c._id);

    const topics = await Topic.find({ chapter_id: { $in: chapterIds } }).select('_id name').lean();
    const topicIds = new Set(topics.map(t => t._id.toString()));
    const topicNames = new Set(topics.map(t => t.name));

    return { chapterIds, topicIds, topicNames };
  }

  async _cache(plan, cacheKey) {
    try { await cacheService.set(cacheKey, plan, ADMIN_CONFIG.CACHE_TTL); } catch (e) { /* Redis down */ }
    return plan;
  }
}

module.exports = new DailyPlans();
