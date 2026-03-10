# HOA SaaS Frontend

## Prerequisites

- Node.js (Latest LTS recommended)
- npm (comes with Node.js)

## Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd hoa-frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Running the Development Server

To start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

The application uses `.env.local` for environment variables. Ensure it contains:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret
```
