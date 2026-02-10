# RIGOR - Discipline Tracking App

## Overview

RIGOR is a discipline tracking mobile/web application built with Expo (React Native) and Express. The core concept is "discipline by consequence" — users create irreversible contracts with themselves, committing to daily habits for fixed durations (14, 30, or 66 days). Failures are permanently recorded. The app includes features like daily check-ins, progress tracking with consistency grids, squad-based accountability groups, and an achievement/trophy system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation Structure**: 
  - `(auth)/` — Authentication screens (login, signup, forgot-password) with redirect logic
  - `(tabs)/` — Main app tabs: Today, Progress, Squads, Trophies, Profile
  - `create-contract` — Modal screen for creating new contracts
  - `about` — Modal info screen
- **State Management**: React Context (`AuthProvider`, `RigorProvider`) + TanStack React Query for server state
- **Styling**: React Native StyleSheet with a custom color system in `constants/colors.ts` (cream/orange/black theme)
- **Fonts**: Rubik font family (400-800 weights) via `@expo-google-fonts/rubik`
- **Animations**: `react-native-reanimated` for UI animations, `expo-haptics` for tactile feedback (skipped on web)
- **Platform handling**: Explicit `Platform.OS` checks throughout for web vs native differences (haptics, keyboard handling, safe areas)

### Backend (Express)

- **Runtime**: Express 5, TypeScript compiled with `tsx` (dev) or `esbuild` (prod)
- **Location**: `server/` directory — `index.ts` (entry), `routes.ts` (API routes), `storage.ts` (data layer), `supabase.ts` (auth client)
- **API Pattern**: REST endpoints under `/api/` prefix with JWT Bearer token authentication
- **Auth Middleware**: Extracts Bearer token from Authorization header, validates via Supabase `auth.getUser()`
- **CORS**: Dynamic origin allowlist based on Replit environment variables, plus localhost for development
- **Static serving**: In production, serves Expo web build from `dist/` directory

### Authentication

- **Provider**: Supabase Auth (email/password)
- **Flow**: Server-side routes (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, etc.) proxy to Supabase Auth
- **Token Storage**: Client stores JWT access token, refresh token, and user data in `@react-native-async-storage/async-storage`
- **Session Restoration**: On app load, client reads stored token and validates via `/api/auth/me`

### Data Layer

- **Primary Storage**: Supabase (PostgreSQL) — contracts, day records, squads all managed through Supabase client on the server
- **RLS (Row Level Security)**: Supabase tables have RLS enabled. The server creates per-request authenticated Supabase clients using `createUserClient(accessToken)` to pass the user's JWT, ensuring RLS policies are satisfied
- **Supabase RPC**: Day record creation uses `mark_day_complete(p_contract_id)` stored procedure instead of direct INSERT (RLS blocks direct inserts)
- **Actual Supabase Table Columns**:
  - `contracts`: id, user_id, rule, deadline_hour, deadline_minute, duration_days, started_at, ends_at, status, created_at
  - `day_records`: id, user_id, contract_id, date, completed, created_at
  - `squads`: id, name, code, created_by, created_at
  - `squad_members`: id, squad_id, user_id, joined_at
- **Column Mapping** (server transforms between frontend model and Supabase):
  - Frontend `duration` ↔ Supabase `duration_days`
  - Frontend `start_date` ↔ Supabase `started_at` (normalized to YYYY-MM-DD)
  - Frontend `signed` ↔ Supabase `status` = "active"
  - Frontend `failed`/`critical`/`justification` derived from `completed` boolean
- **Schema Definition**: Drizzle ORM schema in `shared/schema.ts` with `drizzle-zod` for validation. Supabase tables use `user_id` column (not `device_id`) to link data to authenticated users
- **Drizzle Config**: Points to `DATABASE_URL` env var for PostgreSQL, migrations output to `./migrations/`

### Key Domain Concepts

- **Contract**: A commitment with a rule, deadline time (hour:minute), duration (14/30/66 days), and start date. Once signed, it's irreversible. Requires `ends_at` computed as `started_at + duration_days`
- **Day Record**: Daily entry tracking completion status. Only `completed` boolean stored in DB; `failed`/`critical`/`justification` are derived on the server
- **Squad**: Accountability group with shareable join codes
- **Trophies**: Achievement system based on completion milestones (1 to 66 days, zero-fail contracts, multiple contracts)

### Build & Deploy

- **Dev**: Expo dev server + Express backend running concurrently. Expo proxied through Replit domain
- **Production Build**: Custom `scripts/build.js` starts Metro, fetches the web bundle, writes to `dist/`. Server built with esbuild
- **Production Run**: `server:prod` serves the static Expo web build and API from one Express server on port 5000

## External Dependencies

- **Supabase**: Authentication and database. Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
- **PostgreSQL**: Connected via `DATABASE_URL` environment variable, used with Drizzle ORM for schema management
- **Expo Services**: Font loading, notifications, image picker, and other Expo modules
- **AsyncStorage**: Local persistence for auth tokens and app preferences on the client side
- **Environment Variables Required**:
  - `SUPABASE_URL` — Supabase project URL
  - `SUPABASE_ANON_KEY` — Supabase anonymous/public key
  - `DATABASE_URL` — PostgreSQL connection string (for Drizzle migrations)
  - `EXPO_PUBLIC_DOMAIN` — Public domain for API requests (auto-set from Replit)