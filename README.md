# Omnicom Network

Omnicom Network is a modern web application built with [Next.js 16](https://nextjs.org/) (App Router), React 19, and [Tailwind CSS v4](https://tailwindcss.com/). The project utilizes [AWS Amplify Gen 2](https://docs.amplify.aws/) for its backend infrastructure, providing robust authentication features including passwordless OTP and standard email/password login flows.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Backend & Auth**: AWS Amplify Gen 2 (`@aws-amplify/backend`, `aws-amplify`)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Package Manager**: Yarn

## 🛠️ Getting Started

To set up the project on your local machine, follow these steps:

### Prerequisites

- Node.js (v20+ recommended)
- Yarn package manager
- AWS CLI configured (if interacting with the Amplify backend locally)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd omnicom-network
   ```

2. **Install dependencies:**
   The project uses `yarn` for dependency management.

   ```bash
   yarn install
   ```

3. **Initialize the AWS Amplify Sandbox (Optional but recommended):**

   If you need to work with the backend features locally, start the Amplify sandbox environment. This provisions ephemeral cloud resources for local development.
   Follow this guide to setup: https://docs.amplify.aws/react/start/account-setup

   ```bash
   npx ampx sandbox
   ```

4. **Start the development server:**

   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

## 📂 Project Structure

- `app/`: Next.js App Router entry points (`layout.tsx`, `page.tsx`), route segments, and global styles (`globals.css`).
- `components/`: Reusable UI and feature modules (e.g., Explorers, Maps, Animated elements).
- `amplify/`: AWS Amplify Gen 2 backend infrastructure as code (`backend.ts`).
- `public/`: Static assets served at root paths.

## 🔐 Authentication

The project is integrated with AWS Amplify Auth (Cognito). It features a custom, glassmorphic login UI that supports:

- **Passwordless OTP**: Users receive a one-time password via email to log in securely.
- **Standard Login**: Traditional email and password authentication.

## 🏗️ Build and Deployment

The project is configured for continuous deployment on AWS Amplify via the `amplify.yml` specification.

To build the application locally:

```bash
yarn build
```

To start the production server locally:

```bash
yarn start
```

## 📝 Coding Guidelines

- **TypeScript**: Strictly typed development.
- **Styling**: Utility-first styling with Tailwind CSS v4.
- **Linting**: Run `yarn lint` to verify code quality before committing.
