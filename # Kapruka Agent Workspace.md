# Kapruka Agent Workspace

## Project Overview

This workspace contains a full-stack application for the "Thisari" Kapruka AI Shopping Assistant. The project is divided into a frontend Next.js application and a backend NestJS application.

- **Frontend (`Kapruka-FE/`)**: A Next.js (App Router) application built with React 19. It integrates with NextAuth for authentication, Firebase, the Vercel AI SDK, and uses styling via CSS Modules. It provides the user interface for the AI shopping assistant chat, user menus, and authentication modals.
- **Backend (`Kapruka-server/`)**: A NestJS server written in TypeScript. It provides a RESTful API and handles modules such as authentication (JWT), analytics, chat (with AI SDK integrations), user management, and MongoDB interactions via Mongoose.

## Building and Running

### Frontend (`Kapruka-FE/`)

To run or build the frontend, navigate to the `Kapruka-FE` directory:

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Start the production server
npm run start

# Run linting
npm run lint
```

The frontend typically runs on `http://localhost:3000`.

### Backend (`Kapruka-server/`)

To run or build the backend, navigate to the `Kapruka-server` directory:

```bash
# Start the development server (with watch mode)
npm run start:dev

# Build the application
npm run build

# Start the production server
npm run start:prod

# Run unit tests
npm run test
```

The backend typically runs on `http://localhost:3001/api`.

## Development Conventions

- **TypeScript**: Both the frontend and backend are strongly typed using TypeScript.
- **Architecture**:
  - The frontend uses the Next.js App Router (`src/app`) and component-based structure (`src/components`).
  - The backend uses standard NestJS modular architecture, grouping features by domain (e.g., `auth`, `chat`, `users`, `analytics`) with controllers, services, and schemas.
- **Styling**: The frontend uses CSS Modules (e.g., `page.module.css`).
- **Code Quality**: Both projects use ESLint. The backend additionally uses Prettier for formatting and Jest for testing. Global validation pipes with class-validator are used on the backend.
