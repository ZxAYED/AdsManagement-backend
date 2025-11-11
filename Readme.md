# sceneAds - Ad Management Platform

sceneAds is a robust backend solution for an ad management e-commerce platform. It provides a comprehensive set of tools to manage users, advertisements, campaigns, and payments. This is a team project.

## Features

- User Authentication & Management: Secure user registration, login, and profile management with role-based access control.
- Ad Campaign Management: Create, manage, and monitor advertising campaigns.
- Banner Management: Upload and manage ad banners.
- Bundle & Screen Management: Group ads into bundles and manage screen placements.
- Payment Processing: Integrated with Stripe for handling payments.
- Real-time Chat System: A WebSocket-based chat system for one-on-one communication. Features include:
  - JWT-based Authentication: Secure WebSocket connections.
  - Live Messaging: Real-time message delivery to online users.
  - Message Persistence: Chat history is saved to the database.
  - History Fetching: Ability to retrieve past conversations.
  - Real-time Notifications: Users receive instant notifications for new messages.
- Scheduled Tasks: Automated jobs for tasks like updating campaign statuses.
- File Storage: Integrated with Supabase for cloud-based file storage.

## Technologies Used

- Backend: Node.js, Express.js, TypeScript
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT (JSON Web Tokens)
- File Storage: Supabase
- Payments: Stripe
- Real-time: ws (WebSocket)
- Scheduling: node-cron

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

### Installation

1.  Clone the repository:

        git clone <repository-url>

    cd danaj242-backend

2.  Install dependencies:

        npm install

3.  Set up environment variables:
    Create a .env file in the root directory and add the following environment variables. Replace the placeholder values with your actual credentials.

        # Database

    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

    # JWT

    JWT_SECRET="your-super-secret-jwt-key"
    JWT_EXPIRES_IN="1d"

    # Supabase

    SUPABASE_URL="your-supabase-project-url"
    SUPABASE_KEY="your-supabase-api-key"

    # Stripe

    STRIPE_SECRET_KEY="your-stripe-secret-key"

    # Nodemailer (for sending emails)

    EMAIL_HOST="smtp.example.com"
    EMAIL_PORT="587"
    EMAIL_USER="your-email@example.com"
    EMAIL_PASS="your-email-password"

4.  Apply database migrations:

        npx prisma migrate deploy

5.  Generate Prisma Client:

        npx prisma generate

### Running the Application

- Development mode:

        npm run dev

  This will start the server with auto-reloading on file changes.

- Production mode:

        npm run build

  npm run start:prod

## API Endpoints

The API is structured into modules. Here are the primary endpoints:

- /api/v1/auth - Authentication and User Login
- /api/v1/users - User Management
- /api/v1/banners - Banner Management
- /api/v1/bundles - Bundle Management
- /api/v1/campaigns - Campaign Management
- /api/v1/payments - Payment Processing
- /api/v1/screens - Screen Management
- /api/v1/get-in-touch - Contact/Lead Forms

## Project Structure

The project follows a modular architecture to keep the codebase organized and maintainable.

\`\`\`
src/
├── app/
│ ├── constants/ # Application-wide constants
│ ├── middlewares/ # Custom Express middlewares
│ ├── modules/ # Core feature modules (Auth, User, Campaign, etc.)
│ └── routes/ # Main API router
├── config/ # Configuration files (e.g., dotenv setup)
├── corn/ # Scheduled cron jobs
├── helpers/ # Helper functions
├── shared/ # Shared utilities (e.g., catchAsync, sendResponse)
└── utils/ # General utility functions
├── app.ts # Express app configuration
└── server.ts # Server entry point
\`\`\`
