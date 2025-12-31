# Project Style Guide & Development Standards This document serves as the implementation and style guide for the Portals Template project. It is designed to ensure consistency across the codebase and allow new developers to replicate the project's architecture and design system. ## 1. Tech Stack - **Framework**: [Next.js](https://nextjs.org/) (App Router, Version 16+) - **Language**: [TypeScript](https://www.typescriptlang.org/) - **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - **State Management**: React Context API - **Icons**: [React Icons](https://react-icons.github.io/react-icons/) (feather icons preferred via fi) - **Charts**: [Recharts](https://recharts.org/) - **Backend Integration**: AWS Amplify (implied) / REST API Integration ## 2. Directory Structure
/
├── app/                  # Next.js App Router pages and layouts
│   ├── globals.css       # Global styles and Tailwind theme config
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable UI components
│   ├── Shared/           # Atomic components (Card, Badge, Button, etc.)
│   └── [Component].tsx   # Feature-specific components
├── context/              # React Context Providers (Global State)
├── constants.ts          # Global constants, Mock Data, Configs
├── types.ts              # Shared TypeScript interfaces
└── utils.ts              # Helper functions
## 3. Naming Conventions - **Files & Directories**: - Components: PascalCase.tsx (e.g., Dashboard.tsx, MiniCalendar.tsx) - Utilities/Config: camelCase.ts (e.g., utils.ts, constants.ts) - Next.js Routes: kebab-case folders (standard Next.js convention) - **Code**: - Components: PascalCase - Functions/Variables: camelCase - Constants: UPPER_SNAKE_CASE (e.g., API_BASE_URL) - Types/Interfaces: PascalCase (e.g., Employee, UserRole) ## 4. Coding Standards ### TypeScript - **Strict Typing**: Avoid any where possible. Define interfaces in types.ts for shared models or inline for component-specific props. - **Props Interface**: Define a Props interface for components or type them inline if simple.
tsx
// Example
interface DashboardProps {
  user: Employee;
  notify: (msg: string, type: 'success' | 'error') => void;
}
### Component Pattern - **Functional Components**: Use const + Arrow functions. - **Hooks**: Place hooks (useState, useEffect) at the top of the component. - **Return**: Return clearly structured JSX. ## 5. Design System The project uses a customized Tailwind CSS setup with CSS variables defined in @theme within app/globals.css. ### Color Palette | Name | CSS Variable | Hex Fallback | Usage | |------|--------------|--------------|-------| | **Brand Primary** | --color-brand | #a3e635 (Lime) | Main buttons, highlights, accents | | **Brand Hover** | --color-brand-hover | #84cc16 | Hover states for brand elements | | **Brand Text** | --color-brand-text | #1a2e05 | Text on top of brand color | | **Dark Background** | --color-darkbg | #18181b | Main dark mode background | | **Dark Card** | --color-darkcard | #27272a | Card background in dark mode | | **Light Background** | --color-lightbg | #f3f4f6 | Main light mode background | ### Typography - **Font Family**: Inter (Sans-serif) via --font-sans. ### Common UI Patterns **1. Cards** Use the Card component from components/Shared. It handles light/dark mode styles automatically.
tsx
import { Card } from './Shared';

<Card className="hover:shadow-lg transition-all">
  <h3>Title</h3>
  <p>Content</p>
</Card>
**2. Buttons** - **Primary**: bg-brand text-brand-text font-bold rounded-xl hover:bg-brand-hover - **Secondary/Action**: hover:bg-gray-50 dark:hover:bg-white/5 **3. Modals** Use the Modal component from components/Shared for consistent overlay and animations. **4. Dark Mode** - Support dark mode using the .dark class strategy. - Styles often use text-gray-900 dark:text-white for readability. ## 6. State Management Global application state (like User data, Admin Mode toggle) is handled via AppContext.
tsx
import { useApp } from '../context/AppContext';

const { adminMode, toggleAdminMode } = useApp();
## 7. API Integration - **Fetching**: Use fetch (or Axios) in useEffect or event handlers. - **Base URL**: Always use API_BASE_URL from constants.ts. - **Loading States**: Handle loading states explicitly in UI (spinners or skeletons). - **Notifications**: Use the notify function passed down or from context to show success/error toasts. ## 8. Development Workflow 1. **Add Component**: Create in components/. 2. **Define Types**: Update types.ts if the data model changes. 3. **Update Constants**: Add new mocks or configs in constants.ts. 4. **Style**: Use utility classes (Tailwind). Avoid inline style={{}} unless dynamic.'