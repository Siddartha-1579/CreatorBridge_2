# CreatorBridge — Demonstration Screenshot Guide

This directory catalogs the key visual demonstration walkthroughs for hackathon evaluators and judges. All routes and workflows can be inspected locally or on the live deployment.

---

## 1. Landing & Marketplace Discovery
- **Route**: `/` and `/discover`
- **Key Elements**:
  - CreatorBridge logo and navigation header.
  - Interactive specialization carousel (AI Cinematography, Neural Voiceover, Runway Gen-3 Motion, 3D Generative VFX).
  - Public creator card grid with verified trust badges, primary AI tool tags, and specialization filters.
  - Direct entry points to Creator Hub and Brand Hub.

---

## 2. Role-Specific Authentication
- **Routes**: `/auth/creator` and `/auth/brand`
- **Key Elements**:
  - Independent creator vs. brand login and registration forms.
  - Cloudflare Turnstile human verification widget.
  - Role preservation upon authentication.
  - Seeded demo account one-click credentials.

---

## 3. Creator Hub: Campaigns Discovery
- **Route**: `/creator/campaigns`
- **Key Elements**:
  - Active Content Rewards marketplace cards.
  - CPM rates (`$12.00 / 1K views`), remaining reward pools, and deliverable tags.
  - Category filters: Beauty & Skincare, Sustainable Apparel, AI Productivity, Beverage & Wellness.
  - Quick action: "Inspect Brief & Join".

---

## 4. Creator Hub: Campaign Detail & Submission Workflow
- **Route**: `/creator/campaigns/:campaignId`
- **Key Elements**:
  - Verified reward campaign badge and active pool progress bar.
  - Brand creative direction, do's & don'ts, visual hooks, and required hashtags.
  - One-click campaign join button.
  - Video Clip Submission Modal: video URL, target platform (TikTok, Reels, Shorts), AI tools utilized, and self-reported initial views.

---

## 5. Creator Hub: Submissions & Recorded Views Tracker
- **Route**: `/creator/submissions`
- **Key Elements**:
  - Metrics row: Total Submissions, Approved Rewards, Recorded Views, Approved Rewards (Demo).
  - Status filters: All, Pending Review, Approved, Revision Requested, Rejected.
  - Submission cards displaying self-reported vs. verified view counts, brand notes, and external clip links.

---

## 6. Creator AI Portfolio & Studio
- **Route**: `/creator/portfolio` and `/creators/:creatorId`
- **Key Elements**:
  - Multi-stage generative AI pipeline: Concept Prompt → Model Checkpoints → Video Generation → Upscaling & Color Grade.
  - Interactive 3D portfolio project cards.
  - Verified Trust Score breakdown (identity verification, platform delivery record, AI provenance).

---

## 7. Brand Hub: Campaign Operations Dashboard
- **Route**: `/brand/campaigns`
- **Key Elements**:
  - Brand's active, draft, and paused campaigns.
  - Pool utilization meters, live participant counts, and clip submission queues.
  - "New Campaign Brief" AI-assisted creation launcher.

---

## 8. Brand Hub: Clip Review & CPM Reward Approval
- **Route**: `/brand/campaigns/:campaignId/submissions`
- **Key Elements**:
  - Submission review queue with video preview links and creator AI tool stacks.
  - Review Modal:
    - Input audited verified views.
    - Automatic CPM reward calculation (`verified_views / 1000 * cpm_rate`).
    - Remaining pool cap validation.
    - Creator feedback notes for revisions or rejections.

---

## 9. Brand Hub: Campaign Analytics & Creator Leaderboard
- **Route**: `/brand/campaigns/:campaignId/analytics`
- **Key Elements**:
  - Total tracked views generated across creator clips.
  - Allocated demo rewards vs. total budget pool.
  - Approved vs. pending submissions breakdown.
  - Creator performance leaderboard ranking top contributors by verified views and approved rewards.

---

## 10. Brand Community Updates
- **Route**: `/brand/community` and `/creator/community`
- **Key Elements**:
  - Brand announcements, downloadable asset packs, and brief tips.
  - Interactive like counters.
  - Brand post creation and owner-only deletion controls.
