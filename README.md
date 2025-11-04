# AI PC Builder

AI PC Builder is a full-stack MERN application that allows users to create, customize, and get AI-powered recommendations for their perfect PC build. It features an intelligent chatbot that assists users in selecting components based on their needs and budget, along with a comprehensive set of tools for both novice builders and enthusiasts.

## Features

* **AI-Powered Chatbot**: Get instant PC build recommendations by simply stating your needs (e.g., "a gaming PC under $1000").
* **Custom PC Builder**: A step-by-step interface to build a PC from scratch, with smart suggestions and compatibility checks.
* **AI Upgrade Assistant**: Input your current PC components to get intelligent upgrade recommendations based on your budget and goals.
* **Component Explorer**: Browse, filter, and compare a wide range of PC components with detailed specifications.
* **User Authentication**: Secure sign-up and sign-in functionality provided by Clerk, allowing users to save and manage their custom builds.
* **Admin Dashboard**: A protected area for administrators to manage products, pre-built PCs, and users.

## Tech Stack

**Frontend:**

* **React 19** with Vite
* **React Router v7** for client-side routing
* **Zustand** for global state management
* **TanStack Query (React Query)** for server state management and data fetching
* **Tailwind CSS** for styling
* **Framer Motion** for animations

**Backend:**

* **Node.js** with **Express.js**
* **Serverless Functions** (ready for Vercel deployment)
* **MongoDB** with **Mongoose** as the ODM
* **Google Gemini API** for AI-powered recommendations
* **Clerk** for user authentication and management

## Getting Started

### Prerequisites

* Node.js (v18 or later recommended)
* MongoDB Atlas account (or a local MongoDB instance)
* Clerk account for authentication keys
* Google Gemini API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/ai-pc-building-website.git](https://github.com/your-username/ai-pc-building-website.git)
    cd ai-pc-building-website
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following:

    ```env
    # MongoDB Connection String
    MONGO_URI=your_mongodb_connection_string

    # Clerk Authentication Keys
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key

    # Google Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Populate the database:**

    The project includes a migration script to populate your MongoDB database with initial component and pre-built PC data.

    ```bash
    node scripts/migrate.js
    ```

5.  **Run the development server:**

    This will start both the React frontend and the Express backend serverless functions.

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

## Deployment

This application is configured for easy deployment on **Vercel**.

1.  Push your code to a GitHub repository.
2.  Import the repository into your Vercel account.
3.  Vercel will automatically detect the Vite frontend and Node.js backend.
4.  Add your environment variables in the Vercel project settings.
5.  Deploy!

The `vercel.json` file is already configured to handle API routing.
