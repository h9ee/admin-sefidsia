# تحلیل بک‌اند «سفید و سیاه» — مرجع ساخت پنل ادمین

> Stack بک‌اند: Node.js + Express + TypeScript + Sequelize (MySQL)
> Base URL: `/api` — احراز هویت فقط با Bearer Token (بدون cookie)

---

## ۱. سیستم احراز هویت (Auth)

- دو روش ورود: **موبایل/OTP** و **موبایل/پسورد**.
- توکن‌ها: `accessToken` (پیش‌فرض 15m) + `refreshToken` (پیش‌فرض 30d). امضا با دو secret جدا.
- payload توکن: `{ sub, username, userType, roles: string[] }` — **permissionها داخل توکن نیستند**.
- transport: فقط هدر `Authorization: Bearer <accessToken>`. refreshToken در **body** ارسال می‌شود.
- refresh دارای **rotation** است (توکن قبلی revoke و جفت جدید صادر می‌شود).

### endpoints احراز هویت — `/api/auth`
| METHOD | path | auth | توضیح |
|---|---|---|---|
| POST | `/check-mobile` | عمومی | `{ exists, hasPassword }` |
| POST | `/request-otp` | عمومی | `purpose: login\|reset` ، کد ۵ رقمی، TTL ۲ دقیقه |
| POST | `/verify-otp` | عمومی | login → `{ user, tokens }` / reset → `{ resetToken }` |
| POST | `/login` | عمومی | `{ mobile, password }` → `{ user, tokens }` |
| POST | `/set-password` | authGuard | تنظیم پسورد کاربر لاگین‌شده |
| POST | `/reset-password` | عمومی | `{ resetToken, password }` |
| POST | `/refresh` | عمومی | `{ refreshToken }` → جفت توکن جدید |
| POST | `/logout` | عمومی | `{ refreshToken }` → revoke توکن در DB (idempotent) |
| GET | `/me` | authGuard | کاربر + `roles[]` که هرکدام `permissions[]` دارند |

> **منبع permission فرانت:** از `/me` (یا پاسخ login) بخوانید؛ roles را به permission flat تبدیل کنید. نقش `developer` = همه‌ی دسترسی‌ها (wildcard).

---

## ۲. سیستم دسترسی (Permissions & Roles)

### نقش‌ها (همه `isSystem: true`)
| slug | نام | دسترسی‌ها |
|---|---|---|
| `developer` | توسعه‌دهنده | **ALL** — bypass کامل در middleware |
| `admin` | مدیر | ALL |
| `moderator` | ناظر | articles.read/update, questions.read/update, answers.update, comments.update/delete, reports.manage, moderation.manage, tickets.read/update/assign, tickets.reply.internal |
| `doctor` | پزشک | articles.read/create/update/publish/review, questions.read/create, answers.create/update, comments.create/update |
| `user` | کاربر | articles.read/create/update/publish, questions.read/create/update, answers.create/update, comments.create/update |

> کاربر تازه‌ثبت‌نام (OTP) به‌صورت پیش‌فرض نقش `user` می‌گیرد.

### لیست کامل permission slugها (گروه‌بندی بر اساس ماژول)
- **users**: `users.read`, `users.create`*, `users.update`, `users.delete`
- **roles**: `roles.manage`
- **permissions**: `permissions.manage`
- **articles**: `articles.read`, `articles.create`, `articles.update`, `articles.delete`, `articles.publish`, `articles.review`
- **questions**: `questions.read`, `questions.create`, `questions.update`, `questions.delete`
- **answers**: `answers.create`, `answers.update`, `answers.delete`
- **comments**: `comments.create`, `comments.update`, `comments.delete`
- **tags**: `tags.manage`
- **categories**: `categories.manage`
- **doctors**: `doctors.verify`
- **reports**: `reports.manage`
- **moderation**: `moderation.manage`
- **audit**: `audit.read`
- **errorLogs**: `errorLogs.manage`
- **tickets**: `tickets.read`, `tickets.update`, `tickets.assign`, `tickets.reply.internal`, `tickets.delete`
- **تعریف‌شده ولی بدون route**: `leaderboard.manage`, `notifications.manage`, `users.create`*

---

## ۳. فرمت پاسخ API

**موفق:**
```json
{ "success": true, "message": "...", "data": <T>, "meta": { "page":1, "limit":20, "total":0, "totalPages":0 } }
```
- `meta` فقط در لیست‌های صفحه‌بندی‌شده. خبری از فیلد `pagination` یا wrapper تو در تو نیست؛ همیشه زیر `data`.

**خطا:**
```json
{ "success": false, "message": "...", "code": "ERROR_CODE", "details": <optional> }
```
کدهای خطا: `UNAUTHORIZED`(401), `FORBIDDEN`(403), `NOT_FOUND`(404), `BAD_REQUEST`(400), `CONFLICT`(409), `UNPROCESSABLE`(422), `TOO_MANY_REQUESTS`(429), `VALIDATION_ERROR`(422, details=`[{path,message}]`), `UNIQUE_CONSTRAINT`(409), `INTERNAL_ERROR`(500), `ROUTE_NOT_FOUND`(404), و کدهای auth: `INVALID_CREDENTIALS`, `INVALID_REFRESH`, `OTP_INVALID`, `OTP_MISMATCH`, `RESET_TOKEN_INVALID`, `SMS_FAILED`.

**صفحه‌بندی:** query → `page`, `limit`(1–100), `sortBy`, `sortOrder`(asc/desc), `q`. پیش‌فرض `page=1, limit=20, max=100`. مرتب‌سازی پیش‌فرض `createdAt DESC`.

---

## ۴. مدل‌های دیتابیس (تمام فیلدها)

### کاربران و دسترسی‌ها

**User** (`users`) — paranoid (soft delete)
`id`, `firstName` STRING(80), `lastName` STRING(80), `username` STRING(60) UNIQUE NOT NULL, `mobile` STRING(20) UNIQUE, `email` STRING(160) UNIQUE, `passwordHash` STRING(255), `avatar` STRING(500), `bio` TEXT, `gender` ENUM(male,female,other), `birthDate` DATEONLY, `status` ENUM(active,blocked,pending)=active, `userType` ENUM(normal,doctor,admin)=normal, `reputation` INT=0, `xp` INT=0, `level` INT=1, `isVerified` BOOL=false, `lastLoginAt` DATE, + timestamps + `deletedAt`. متد `toSafeJSON()` بدون passwordHash.

**Role** (`roles`): `id`, `name` STRING(80), `slug` STRING(80) UNIQUE, `description` STRING(255), `isSystem` BOOL=false, timestamps.

**Permission** (`permissions`): `id`, `name` STRING(120), `slug` STRING(120) UNIQUE, `module` STRING(60), `action` STRING(60), `description` STRING(255), timestamps.

**RolePermission** (`role_permissions`): `id`, `roleId`, `permissionId`, createdAt only. UNIQUE(roleId,permissionId).

**UserRole** (`user_roles`): `id`, `userId`, `roleId`, createdAt only. UNIQUE(userId,roleId).

### پزشکان

**DoctorProfile** (`doctor_profiles`): `id`, `userId` UNIQUE, `medicalCode` STRING(50) UNIQUE, `specialty` STRING(120) NOT NULL, `subSpecialty`, `clinicName`, `clinicAddress`, `city`, `province`, `education` TEXT, `experienceYears` INT=0, `biography` TEXT, `website`, `instagram`, `linkedin`, `verificationStatus` ENUM(pending,approved,rejected)=pending, `verifiedAt`, `verifiedBy`, `ratingAverage` FLOAT=0, `ratingCount` INT=0, `answerCount` INT=0, `approvedArticleCount` INT=0, `acceptedAnswerCount` INT=0, `helpfulVotes` INT=0, `rankScore` FLOAT=0, timestamps.

### مقالات

**Article** (`articles`) — paranoid
`id`, `title` STRING(255), `subtitle` STRING(300), `slug` STRING(280) UNIQUE, `summary` STRING(500), `content` LONGTEXT NOT NULL, `coverImage`, `coverImageAlt`, `authorId`, `reviewedByDoctorId`, `categoryId`, `status` ENUM(draft,pending_review,scheduled,published,rejected,archived)=draft, `medicalReviewStatus` ENUM(not_required,pending,approved,rejected)=not_required, `isFeatured` BOOL=false, `publishedAt`, `scheduledAt`, `lastReviewedAt`, `allowComments` BOOL=true, `allowReactions` BOOL=true, `viewCount` INT=0, `likeCount` INT=0, `commentCount` INT=0, `readingTime` INT=1, `contentType` ENUM(guide,news,explainer,research_summary,opinion,case_study)=guide, `audienceLevel` ENUM(general,patient,caregiver,professional)=general, `audienceAge` ENUM(all,children,teen,adult,senior)=all, `contentWarning` ENUM(none,medical_advice_required,sensitive,urgent,graphic)=none, `disclaimer` TEXT, `keyTakeaways` JSON(string[]), `faq` JSON({question,answer}[]), `references` JSON, و فیلدهای SEO: `seoTitle`, `seoDescription`, `canonicalUrl`, `focusKeyword`, `ogTitle`, `ogDescription`, `ogImage`, `twitterCard` ENUM(summary,summary_large_image). timestamps + deletedAt.

**ArticleCategory** (`article_categories`): `id`, `name` STRING(120), `slug` STRING(160) UNIQUE, `shortDescription`, `description` TEXT, `icon`, `coverImage`, `color` STRING(7), `parentId` (self-FK), `status` ENUM(active,hidden,archived)=active, `isFeatured` BOOL=false, `sortOrder` INT=0, و SEO: `metaTitle`, `metaDescription`, `metaKeywords`, `ogImage`, `canonicalUrl`, `noIndex` BOOL=false. timestamps.

**ArticleTag** (`article_tags`): `id`, `articleId`, `tagId`. بدون timestamps. UNIQUE(articleId,tagId).

**ArticleReview** (`article_reviews`): `id`, `articleId`, `doctorId`, `status` ENUM(approved,rejected,needs_changes), `comment` TEXT, createdAt only.

### تگ‌ها

**Tag** (`tags`): `id`, `name` STRING(80), `slug` STRING(120) UNIQUE, `description` STRING(500), `usageCount` INT=0, `followerCount` INT=0, timestamps.

**QuestionTag** (`question_tags`): `id`, `questionId`, `tagId`. بدون timestamps. UNIQUE(questionId,tagId).

**TagFollow** (`tag_follows`): `id`, `userId`, `tagId`, createdAt only. UNIQUE(userId,tagId).

### پرسش و پاسخ

**Question** (`questions`) — paranoid
`id`, `title` STRING(255), `slug` STRING(280) UNIQUE, `body` LONGTEXT, `userId`, `acceptedAnswerId`, `status` ENUM(open,answered,closed,duplicate,hidden)=open, `isAnonymous` BOOL=false, `viewCount` INT=0, `answerCount` INT=0, `voteScore` INT=0, `commentCount` INT=0, `medicalWarningLevel` ENUM(normal,sensitive,urgent)=normal, `seoTitle`, `seoDescription`. timestamps + deletedAt.

**Answer** (`answers`) — paranoid
`id`, `questionId`, `userId`, `body` LONGTEXT, `isDoctorAnswer` BOOL=false, `isAccepted` BOOL=false, `voteScore` INT=0, `commentCount` INT=0, `status` ENUM(active,hidden,deleted)=active. timestamps + deletedAt.

**Comment** (`comments`) — paranoid، polymorphic
`id`, `userId`, `targetType` ENUM(article,question,answer), `targetId`, `body` TEXT, `status` ENUM(active,hidden,deleted)=active, `parentId` (self-FK، reply نخی), `likeCount` INT=0. timestamps + deletedAt.

### تعامل و گزارش

**Reaction** (`reactions`): `id`, `userId`, `targetType` ENUM(article,question,answer,comment), `targetId`, `type` ENUM(like,dislike,upvote,downvote,helpful,dangerous,scientific,personal_experience), createdAt only. UNIQUE(userId,targetType,targetId,type).

**Report** (`reports`): `id`, `reporterId`, `targetType` ENUM(article,question,answer,comment,user), `targetId`, `reason` STRING(120), `description` TEXT, `status` ENUM(pending,reviewed,rejected,resolved)=pending, `reviewedBy`, timestamps.

**ModerationLog** (`moderation_logs`): `id`, `moderatorId`, `action` STRING(60), `targetType` STRING(60), `targetId`, `reason` STRING(500), createdAt only.

### اعلان‌ها

**Notification** (`notifications`): `id`, `userId`, `type` STRING(80), `title` STRING(255), `body` TEXT, `data` JSON, `isRead` BOOL=false, createdAt only.

### گیمیفیکیشن

**Badge** (`badges`): `id`, `name`, `slug` UNIQUE, `description`, `icon`, `xpReward` INT=0, `type` ENUM(user,doctor,article,question,answer), timestamps.

**UserBadge** (`user_badges`): `id`, `userId`, `badgeId`, `reason` STRING(255), createdAt only. UNIQUE(userId,badgeId).

**LevelRule** (`level_rules`): `id`, `level` INT UNIQUE, `title` STRING(80), `minXp` INT, `benefits` TEXT, createdAt only.

**XPLog** (`xp_logs`): `id`, `userId`, `action` STRING(80), `points` INT, `sourceType`, `sourceId`, `description`, createdAt only.

**LeaderboardSnapshot** (`leaderboard_snapshots`): `id`, `userId`, `scope` ENUM(daily,weekly,monthly,all_time), `category` ENUM(users,doctors,answers,articles), `score` FLOAT, `rank` INT, createdAt only.

### دنبال‌کردن

**UserFollow** (`user_follows`): `id`, `followerId`, `followingId`, createdAt only. UNIQUE(followerId,followingId).

### رسانه

**Media** (`media`) — paranoid
`id`, `uploaderId`, `kind` ENUM(image,video,audio,file), `mimeType`, `size` INT.UNSIGNED, `url`, `thumbnailUrl`, `filename`, `originalName`, `width`, `height`, `duration` FLOAT, `alt`, `title`, `folder`, `checksum` STRING(64) (SHA-256 dedup). timestamps + deletedAt.

### تیکتینگ

**Ticket** (`tickets`) — paranoid
`id`, `ticketNumber` STRING(32) UNIQUE, `subject` STRING(255), `description` LONGTEXT, `status` ENUM(open,in_progress,awaiting_user,resolved,closed)=open, `priority` ENUM(low,normal,high,urgent)=normal, `category` ENUM(general,technical,billing,medical_inquiry,account,feedback,bug,other)=general, `userId`, `assignedTo`, `firstResponseAt`, `lastActivityAt`=NOW, `closedAt`, `closedBy`, `userRating` INT(1-5), `userFeedback` TEXT, `isInternal` BOOL=false. timestamps + deletedAt.

**TicketMessage** (`ticket_messages`) — paranoid: `id`, `ticketId`, `userId`, `body` LONGTEXT, `isInternalNote` BOOL=false, `attachments` JSON. timestamps + deletedAt.

**TicketActivity** (`ticket_activities`): `id`, `ticketId`, `actorId`, `action` ENUM(created,replied,note_added,status_changed,priority_changed,category_changed,assigned,unassigned,reopened,closed,rated), `payload` JSON, createdAt only.

### لاگ و امنیت

**AuditLog** (`audit_logs`): `id`, `userId`, `action` STRING(60), `entity` STRING(80), `entityId` STRING(80), `oldData` JSON, `newData` JSON, `ip`, `userAgent`, createdAt only.

**ErrorLog** (`error_logs`): `id`, `level` ENUM(error,warn,critical)=error, `statusCode`, `code`, `name`, `message` TEXT, `messageFa` STRING(500)='خطای سرور', `stack` LONGTEXT, `source` STRING(60)='http', `method`, `path`, `url`, `query` JSON, `body` JSON, `params` JSON, `details` JSON, `userId`, `ip`, `userAgent`, `resolved` BOOL=false, `resolvedAt`, `resolvedBy`, createdAt only.

**OtpCode** (`otp_codes`): `id`, `mobile`, `codeHash`, `purpose` ENUM(login,reset), `attempts` INT=0, `consumedAt`, `expiresAt`, `resetTokenHash`, `resetTokenExpiresAt`, `ip`, `userAgent`, timestamps.

**RefreshToken** (`refresh_tokens`): `id`, `userId`, `tokenHash` STRING(255) UNIQUE, `expiresAt`, `revokedAt`, `ip`, `userAgent`, createdAt only.

---

## ۵. لیست کامل endpoints (به‌جز auth، در بخش ۱)

### Users — `/api/users`
| METHOD | path | permission |
|---|---|---|
| GET | `/` | users.read |
| GET | `/:id` | users.read |
| PATCH | `/:id` | users.update |
| DELETE | `/:id` | users.delete |
| POST | `/:id/roles` | roles.manage |
| DELETE | `/:id/roles/:roleId` | roles.manage |

### Roles — `/api/roles` (همه `roles.manage`)
GET `/`, GET `/:id`, POST `/`, PATCH `/:id`, DELETE `/:id`, POST `/:id/permissions`, DELETE `/:id/permissions/:permissionId`, PUT `/:id/permissions` (set کامل).

### Permissions — `/api/permissions` (همه `permissions.manage`)
GET `/`, GET `/:id`, POST `/`, PATCH `/:id`, DELETE `/:id`.

### Doctors — `/api/doctors`
GET `/leaderboard` (optional), GET `/` (optional), GET `/:id` (optional), POST `/profile` (authGuard), PATCH `/profile` (authGuard), POST `/:id/verify` (**doctors.verify**).

### Articles — `/api/articles`
GET `/` (optional), GET `/:slug` (optional), POST `/` (articles.create), PATCH `/:id` (articles.update), DELETE `/:id` (articles.delete), POST `/:id/publish` (articles.publish), POST `/:id/review` (articles.review).

### Categories — `/api/categories`
GET `/` (optional), GET `/:id` (optional), POST `/` (categories.manage), PATCH `/:id` (categories.manage), DELETE `/:id` (categories.manage).

### Questions — `/api/questions`
GET `/` (optional), GET `/:slug` (optional), GET `/:id/related` (optional), POST `/` (questions.create), PATCH `/:id` (questions.update), DELETE `/:id` (questions.delete), POST `/:id/accept-answer` (authGuard, ownership در service).

### Answers — `/api/questions/:questionId/answers` و `/api/answers`
GET `/questions/:questionId/answers` (optional), POST همان (answers.create), PATCH `/answers/:id` (answers.update), DELETE `/answers/:id` (answers.delete).

### Comments — `/api/comments`
GET `/` (optional), POST `/` (comments.create), PATCH `/:id` (comments.update), DELETE `/:id` (comments.delete).

### Reactions — `/api/reactions`
POST `/` (authGuard), DELETE `/:id` (authGuard).

### Tags — `/api/tags`
GET `/` (optional), GET `/:id` (optional), POST `/` (tags.manage), PATCH `/:id` (tags.manage), DELETE `/:id` (tags.manage), POST `/:id/follow` (authGuard), DELETE `/:id/follow` (authGuard).

### Gamification — `/api/gamification`
GET `/me` (authGuard), GET `/leaderboard` (optional), GET `/badges` (optional), GET `/xp-logs` (authGuard).

### Notifications — `/api/notifications` (همه authGuard)
GET `/`, GET `/unread-count`, POST `/:id/read`, POST `/read-all`.

### Reports — `/api/reports`
POST `/` (authGuard - هر کاربر), GET `/` (reports.manage), PATCH `/:id/review` (reports.manage).

### Moderation — `/api/moderation` (همه moderation.manage)
POST `/` (act), GET `/logs`.

### Admin — `/api/admin` (roleGuard: admin|developer)
GET `/dashboard`, GET `/stats`.

### Media — `/api/media` (همه authGuard، بدون permission)
GET `/folders`, GET `/`, POST `/` (multipart `file`), GET `/:id`, PATCH `/:id`, DELETE `/:id`.

### Audit — `/api/audit`
GET `/` (audit.read).

### Tickets — `/api/tickets` (همه authGuard)
GET `/stats` (tickets.read), GET `/staff` (tickets.assign), GET `/` , POST `/`, GET `/:id`, GET `/:id/activities`, POST `/:id/messages`, PATCH `/:id` (tickets.update), POST `/:id/assign` (tickets.assign), POST `/:id/close`, POST `/:id/rate`, DELETE `/:id` (tickets.delete). (`tickets.reply.internal` در service چک می‌شود).

### Error Logs — `/api/error-logs` (همه errorLogs.manage)
GET `/`, GET `/stats`, GET `/:id`, PATCH `/:id/resolve`, PATCH `/:id/unresolve`, DELETE `/clear-resolved`, DELETE `/:id`.

### Health
GET `/api/health` (عمومی).

---

## ۶. نکات کلیدی برای فرانت‌اند ادمین
- همه‌ی `:id`ها **عددی** هستند؛ مقالات/پرسش‌ها با **slug** هم خوانده می‌شوند.
- `validate(schema, 'body'|'query'|'params')` ورودی را coerce و جایگزین می‌کند.
- نقش `developer` همه‌ی permission/role guardها را bypass می‌کند → در UI با او مثل «همه‌چیز مجاز» رفتار کن.
- منبع رسمی permissionها سمت سرور flat union نقش‌هاست؛ فرانت باید از `roles[].permissions[]` در `/me` بسازد.
- صفحه‌بندی همیشه در `meta`؛ خطاها در `code` + `details`.
