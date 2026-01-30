# Code Guideline for Kehen (轻近编程 - 课痕)

## 1. Project Structure

The project follows a feature-based structure combined with the standard Vite + React + Supabase pattern.

```
project-root/
  ├── public/                # Static assets (images, icons)
  ├── src/
  │   ├── components/
  │   │   ├── dashboard/     # CORE Business Logic Components
  │   │   │   ├── BossDashboard.tsx       # Admin management (Students, Classes, Teachers)
  │   │   │   ├── TeacherDashboard.tsx    # Teacher operations (Check-in, Photo upload)
  │   │   │   └── WebsiteContentManager.tsx # CMS for landing page content
  │   │   ├── layout/        # Layout wrappers (DashboardLayout)
  │   │   └── ui/            # Atomic UI components (shadcn/ui based)
  │   ├── contexts/          # Global Contexts (AuthContext for user session)
  │   ├── hooks/             # Custom hooks (use-toast, etc.)
  │   ├── integrations/
  │   │   └── supabase/      # Supabase configuration
  │   │       ├── client.ts  # Supabase client instance
  │   │       └── types.ts   # Database Type definitions (CRITICAL)
  │   ├── lib/               # Utilities (utils.ts, analytics.ts)
  │   ├── pages/             # Page components mapped to Routes
  │   │   ├── Index.tsx      # Landing Page (Public view)
  │   │   └── ...
  │   ├── App.tsx            # Main Application Wrapper (Providers)
  │   └── main.tsx           # Entry Point
  ├── supabase/
  │   └── migrations/        # SQL Migration files (Database Schema & Triggers)
  ├── tailwind.config.ts     # Styling configuration
  └── package.json           # Dependencies
```

## 2. Key Architectural Decisions

### Backend & Database (Supabase)
-   **Single Source of Truth**: The database schema is the source of truth.
-   **Type Safety**: All database types are defined in `src/integrations/supabase/types.ts`.
    -   **Action**: Whenever you modify the DB schema, you **MUST** manually update `types.ts` to reflect the changes (until automated).
-   **Business Logic in DB**: Critical logic like **class hour deduction** is implemented via **PostgreSQL Triggers** (`update_student_hours`) to ensure data consistency, rather than relying solely on frontend calculation.
-   **RLS**: Row Level Security is enabled to protect data access.

### State Management
-   **Server State**: We use **TanStack Query (React Query)** for all async data operations.
    -   **Read**: `useQuery` with keys like `['all-students']`, `['classes']`.
    -   **Write**: `useMutation` for inserts/updates, followed by `queryClient.invalidateQueries` to refresh UI.
-   **Auth State**: Managed by `AuthContext.tsx`, providing `session` and `profile` globally.
-   **Form State**: Local `useState` or controlled inputs.

### UI Strategy
-   **Component Library**: Built on top of **shadcn/ui** (Radix UI + Tailwind CSS).
-   **Dashboard Pattern**: 
    -   `BossDashboard` handles high-level management (CRUD).
    -   `TeacherDashboard` is optimized for mobile/tablet usage (Large buttons, simplified flows).

## 3. Development Workflow

### How to Add a New Feature
1.  **Database First**:
    -   Create a new table or modify existing ones via Supabase Dashboard or SQL.
    -   Write SQL migration in `supabase/migrations/` (for tracking).
2.  **Update Types**:
    -   Modify `src/integrations/supabase/types.ts` to include the new schema.
3.  **Frontend Implementation**:
    -   Create UI components in `src/components/`.
    -   Implement data fetching using `supabase.from('table').select()`.
    -   Handle user interactions.

### Example: Adding a "Remarks" field to Classes
1.  **SQL**: `ALTER TABLE classes ADD COLUMN remarks TEXT;`
2.  **Types**: Add `remarks: string | null` to `classes` Row/Insert/Update types in `types.ts`.
3.  **UI**: 
    -   Update `BossDashboard.tsx`: Add Input field to "Add/Edit Class" dialogs.
    -   Update `TeacherDashboard.tsx`: Display remarks if needed.

## 4. Best Practices

-   **Environment Variables**:
    -   Use `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    -   **NEVER** commit `.env` files to Git.
-   **Error Handling**:
    -   Use `sonner` (`toast.error`) for user feedback.
    -   Wrap async operations in `try/catch`.
-   **Deployment**:
    -   Push to `master` triggers Vercel deployment automatically.
    -   Ensure `package.json` build script is set to `vite build` for production.

## 5. Directory Responsibilities (Detailed)

-   **src/components/dashboard/**: Contains the "Monolithic" dashboard components. These are large, feature-rich components that handle specific user roles.
-   **src/pages/Index.tsx**: The public facing website. It fetches dynamic content (courses, teachers) from `public_` tables.
-   **src/lib/analytics.ts**: Wrappers for Google Analytics and PostHog events.

---
*Last Updated: 2026-01-30*
