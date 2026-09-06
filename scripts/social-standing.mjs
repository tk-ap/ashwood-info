#!/usr/bin/env node
// Fetch TK's current public standing (Instagram + TikTok) via Apify and write
// it to data/public-standing.json. Runs in a GitHub Actions cron; APIFY_TOKEN
// is the repo secret. Read-only: consumes public profile data, writes nothing
// back to either platform.

import { writeFileSync, mkdirSync } from 'node:fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error('APIFY_TOKEN is not set');
  process.exit(1);
}

const ACTORS = {
  instagram: {
    id: 'apify~instagram-scraper',
    input: {
      addParentData: false,
      directUrls: ['https://www.instagram.com/picturesoftk'],
      resultsLimit: 100,
      resultsType: 'posts',
      searchLimit: 10,
      searchType: 'hashtag',
    },
  },
  tiktok: {
    id: 'clockworks~tiktok-scraper',
    input: {
      profiles: ['tiktokoftk'],
      profileScrapeSections: ['videos'],
      profileSorting: 'latest',
      resultsPerPage: 100,
      maxProfilesPerQuery: 10,
      // Download flags off: keep output small and cheap.
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadAvatars: false,
      shouldDownloadMusicCovers: false,
      shouldDownloadSlideshowImages: false,
      commentsPerPost: 0,
      topLevelCommentsPerPost: 0,
      maxRepliesPerComment: 0,
      maxFollowersPerProfile: 0,
      maxFollowingPerProfile: 0,
      excludePinnedPosts: false,
      scrapeAdditionalAuthorMeta: false,
      scrapeRelatedVideos: false,
      scrapeRelatedSearchWords: false,
      aiVideoDescription: false,
      aiVideoSummary: false,
      proxyCountryCode: 'None',
      searchSection: '',
      videoSearchSorting: 'MOST_RELEVANT',
      videoSearchDateFilter: 'ALL_TIME',
      downloadSubtitlesOptions: 'NEVER_DOWNLOAD_SUBTITLES',
    },
  },
};

const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, options = {}) {
  const res = await fetch(`https://api.apify.com/v2/${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...(options.body ? { body: options.body } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Apify ${res.status} ${path}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function runActor(actorId, input) {
  const started = await api(`acts/${actorId}/runs`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const runId = started.data.id;
  let status = started.data.status;
  let detail = started;
  while (!TERMINAL.has(status)) {
    await sleep(5000);
    detail = await api(`actor-runs/${runId}`);
    status = detail.data.status;
  }
  if (status !== 'SUCCEEDED') {
    throw new Error(`${actorId} ended ${status}: ${detail.data.statusMessage || ''}`);
  }
  return api(`actor-runs/${runId}/dataset/items`);
}

const DAY = 86400000;
const avg = (arr) =>
  arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

function extractInstagram(posts) {
  const dated = (posts || [])
    .filter((p) => p.timestamp)
    .map((p) => ({
      at: p.timestamp,
      ts: new Date(p.timestamp).getTime(),
      // -1 is Instagram's "count unavailable" sentinel, not zero.
      likes: p.likesCount >= 0 ? p.likesCount : null,
      comments: p.commentsCount ?? 0,
      caption: p.caption || '',
      type: p.type || 'post',
      url: p.url || '',
    }))
    .sort((a, b) => b.ts - a.ts);

  const recent = dated.filter((p) => Date.now() - p.ts <= 30 * DAY);
  const knownLikes = dated.filter((p) => p.likes != null).map((p) => p.likes);

  return {
    account: 'picturesoftk',
    total_posts: (posts || []).length,
    latest_post_at: dated[0]?.at || null,
    posts_30d: recent.length,
    avg_likes: avg(knownLikes),
    avg_comments: avg(dated.map((p) => p.comments)),
    recent_posts: recent.slice(0, 3).map((p) => ({
      at: p.at,
      caption: p.caption.slice(0, 140),
      likes: p.likes,
      comments: p.comments,
      type: p.type,
      url: p.url,
    })),
  };
}

function extractTikTok(videos) {
  const author = (videos || [])[0]?.authorMeta || {};
  const dated = (videos || [])
    .filter((v) => v.createTimeISO)
    .map((v) => ({
      at: v.createTimeISO,
      ts: new Date(v.createTimeISO).getTime(),
      plays: v.playCount || 0,
      likes: v.diggCount || 0,
      comments: v.commentCount || 0,
      shares: v.shareCount || 0,
      caption: v.text || '',
    }))
    .sort((a, b) => b.ts - a.ts);

  const recent = dated.filter((v) => Date.now() - v.ts <= 30 * DAY);

  return {
    account: 'tiktokoftk',
    followers: author.fans ?? null,
    following: author.following ?? null,
    verified: author.verified ?? false,
    total_videos: (videos || []).length,
    latest_video_at: dated[0]?.at || null,
    videos_30d: recent.length,
    avg_plays: avg(dated.map((v) => v.plays)),
    avg_likes: avg(dated.map((v) => v.likes)),
    avg_comments: avg(dated.map((v) => v.comments)),
    recent_videos: recent.slice(0, 3).map((v) => ({
      at: v.at,
      caption: v.caption.slice(0, 140),
      plays: v.plays,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
    })),
  };
}

const [instagram, tiktok] = await Promise.all([
  runActor(ACTORS.instagram.id, ACTORS.instagram.input).then(extractInstagram),
  runActor(ACTORS.tiktok.id, ACTORS.tiktok.input).then(extractTikTok),
]);

const standing = {
  generated_at: new Date().toISOString(),
  source: 'apify',
  instagram,
  tiktok,
};

mkdirSync('data', { recursive: true });
writeFileSync('data/public-standing.json', JSON.stringify(standing, null, 2) + '\n');
console.log('Wrote data/public-standing.json');
console.log(JSON.stringify(standing, null, 2));
