# SmartThreads

An AI-powered team chat platform that automatically categorizes messages by intent, detects repetitive questions, and keeps team conversations organized with intelligent summaries.

## Project Overview

Team communication tools often become noisy and disorganized. Important decisions get buried, the same questions get asked repeatedly, and it's difficult to find what matters in a long conversation thread.

SmartThreads solves this by using AI to automatically categorize every message into one of six intent types (**Question**, **Update**, **Concern**, **Decision**, **FYI**, **Scheduling**), detect when someone asks something that's already been answered, and generate on-demand conversation summaries filtered by intent. Combined with real-time messaging and threaded replies, it provides a structured team chat experience where information stays findable.

## Tech Stack

### Frontend
- **Next.js 16** (App Router with Server Components and Server Actions)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**

### Backend
- **Next.js API Routes & Server Actions** (full-stack within Next.js)
- **NextAuth v4** with Credentials Provider (email-based authentication)
- **Prisma 7** ORM with `@auth/prisma-adapter`

### Database
- **PostgreSQL** (via Neon serverless Postgres)
- **Prisma Migrations** for schema management

### Real-Time
- **Pusher** (server-side SDK v5 + client-side `pusher-js` v8)

### AI/ML
- **OpenAI GPT-4o-mini** for message categorization, duplicate detection, and conversation summarization

## Setup & Installation

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g., [Neon](https://neon.tech))
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Pusher](https://pusher.com) account (Channels product)

### Installation

```bash
git clone <repository-url>
cd SmartThreads/smartthreads
npm install
```

### Environment Variables

Create a `.env` file inside the `smartthreads/` directory with the following variables:

```env
# Database (PostgreSQL connection string)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Pusher (server-side)
PUSHER_APP_ID="your-app-id"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="us2"

# Pusher (client-side, must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_PUSHER_KEY="your-public-key"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

### Database Setup

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate deploy
```

To generate the Prisma client (if not already generated):

```bash
npx prisma generate
```

## Running the Project

### Development

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

### Background Services

No separate background services or workers are required. Real-time messaging is handled through Pusher's hosted infrastructure, and AI analysis runs inline via OpenAI API calls during server actions.

## How to Use the Platform

### 1. Sign In

Navigate to the login page and enter your email. Authentication uses a credentials-based flow via NextAuth.

### 2. Create a Thread

- Click to create a new thread from the sidebar.
- Give it a title and optionally invite team members by entering their email addresses (comma-separated).
- Only users who have previously logged in can be invited.

### 3. Send Messages

- Type a message in the composer at the bottom of a thread.
- Before sending, SmartThreads analyzes the message with AI to:
  - **Categorize** it as one of: Question, Update, Concern, Decision, FYI, or Scheduling.
  - **Detect duplicates** -- if your message asks something already answered, a warning modal appears showing the previous answer and giving you the option to send anyway or cancel.
- Messages appear in real time for all thread members via Pusher.

### 4. Filter by Category

Use the category filter buttons at the top of the message list to view only messages of a specific intent type (e.g., show only Decisions or Questions).

### 5. Reply to Messages

- Click "Reply" on any message to open the reply thread panel.
- Replies are threaded under the parent message and broadcast in real time.
- Reply counts update live on the parent message.

### 6. Summarize Conversations

- Click the "Summarize" button to open the summary panel.
- Choose an intent filter (All, Question, Update, Concern, Decision, Scheduling, or FYI).
- The AI generates a concise 3-8 bullet point summary of the conversation, scoped to the selected intent.
- Summaries are cached for 60 seconds to reduce redundant API calls.

### 7. Manage Members

- Invite new members to an existing thread using the invite form in the thread header.
- View all current thread participants through the members modal.

### 8. Track Unread Messages

- The sidebar displays unread message counts per thread.
- Counts update in real time and reset when you view the thread.

## Project Structure

```
SmartThreads/
├── smartthreads/                    # Next.js application root
│   ├── app/
│   │   ├── api/auth/[...nextauth]/ # NextAuth API route
│   │   ├── components/             # Shared UI components
│   │   │   ├── category-tag.tsx    # Color-coded intent badge
│   │   │   └── modal.tsx           # Reusable modal dialog
│   │   ├── lib/
│   │   │   ├── actions.ts          # Server actions (core business logic)
│   │   │   ├── auth.ts             # NextAuth configuration
│   │   │   ├── db.ts               # Prisma client & DB connection
│   │   │   ├── llm.ts              # OpenAI integration (categorization & summarization)
│   │   │   ├── pusher-server.ts    # Pusher server-side event broadcasting
│   │   │   └── pusher-client.ts    # Pusher client-side subscriptions
│   │   ├── login/                  # Login page
│   │   ├── threads/
│   │   │   ├── layout.tsx          # Threads layout (sidebar + content)
│   │   │   ├── thread-sidebar.tsx  # Thread list with real-time updates
│   │   │   ├── new/page.tsx        # Create new thread page
│   │   │   └── [id]/              # Dynamic thread view
│   │   │       ├── page.tsx                # Thread page (server component)
│   │   │       ├── realtime-thread.tsx     # Main thread with Pusher subscriptions
│   │   │       ├── message-form.tsx        # Message composer with AI analysis
│   │   │       ├── message-list.tsx        # Message display with category filtering
│   │   │       ├── replies-panel.tsx       # Threaded reply panel
│   │   │       ├── summary-panel.tsx       # AI-generated conversation summary
│   │   │       ├── invite-form.tsx         # Invite members to thread
│   │   │       └── members-modal.tsx       # View thread participants
│   │   ├── generated/prisma/      # Auto-generated Prisma client
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Homepage
│   │   └── globals.css            # Global styles
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (User, Thread, Message, etc.)
│   │   └── migrations/            # Migration history
│   ├── public/                    # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── postcss.config.mjs
└── README.md
```

### Key Directories

| Directory | Purpose |
|---|---|
| `app/lib/` | Core server-side logic: database access, authentication, AI integration, real-time events |
| `app/threads/[id]/` | Thread view components: messaging, replies, summaries, member management |
| `app/components/` | Shared UI components used across pages |
| `prisma/` | Database schema definition and migration history |

### Database Models

| Model | Purpose |
|---|---|
| `User` | Registered users with email-based auth |
| `Thread` | Chat rooms/conversations with optional titles |
| `ThreadMember` | Many-to-many membership with `lastSeenAt` for unread tracking |
| `Message` | Messages with AI-assigned `category` and self-referential `parentMessageId` for reply threading |

## License

Private License

Copyright (c) 2025 Eshi Kohli
All Rights Reserved.

This software is proprietary and confidential.
Unauthorized copying, modification, distribution, or use of this software,
via any medium, is strictly prohibited without prior written permission
from the copyright holder.
