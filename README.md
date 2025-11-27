# MediPredict

This document outlines the recent changes made to the MediPredict application to ensure that the chat and call features work across different networks.

## Changes Made

The primary issue was the use of hardcoded `localhost` URLs in both the frontend and backend code, which prevented communication between the two when they were not running on the same machine. Additionally, the Cross-Origin Resource Sharing (CORS) policies were restrictive and not easily configurable.

Here's a summary of the changes:

### Frontend

-   **Removed Hardcoded URLs:** The hardcoded `http://localhost:8000` URL in the frontend's API requests and WebSocket connections has been replaced with environment variables.
-   **Configurable Environment:** A `.env` file has been added to the `Frontend` directory to allow you to configure the API and WebSocket URLs.

    -   `VITE_API_URL`: The base URL for the backend API.
    -   `VITE_SOCKET_URL`: The URL for the WebSocket server.

### Backend

-   **Centralized CORS Policy:** The CORS policies for both the Express app and the Socket.IO server have been updated to use a single environment variable, `CORS_ALLOWED_ORIGINS`.
-   **Configurable Environment:** A `.env` file has been added to the `Backend` directory to allow you to configure the allowed origins for CORS.
    -   `CORS_ALLOWED_ORIGINS`: A comma-separated list of URLs that are allowed to connect to the backend.

## What You Need to Do

To get the application working in your environment, you need to create/update the `.env` files in both the `Frontend` and `Backend` directories.

### Frontend Configuration

1.  Navigate to the `Frontend` directory.
2.  Create a file named `.env` if it doesn't already exist.
3.  Add the following content to the `.env` file:

    ```
    # This is the base URL for the API.
    # In production, this should be the public URL of your backend.
    VITE_API_URL=http://localhost:8000/api

    # This is the URL for the WebSocket server.
    # In production, this should be the public URL of your socket server.
    VITE_SOCKET_URL=http://localhost:8000
    ```

4.  **Important:** When you deploy your backend to a public server, you must replace `http://localhost:8000` with the public URL of your backend.

### Backend Configuration

1.  Navigate to the `Backend` directory.
2.  Create a file named `.env` if it doesn't already exist.
3.  Add the following content to the `.env` file:

    ```
    # Comma-separated list of allowed origins for CORS
    CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://medipredict-frontend.netlify.app,https://medi-predict-frontend.vercel.app,https://medipredict-backend.onrender.com
    ```

4.  **Important:** When you deploy your frontend, you must add the URL of your deployed frontend to the `CORS_ALLOWED_ORIGINS` list. For example, if you deploy your frontend to `https://my-medipredict.com`, you should add it to the list like this:

    ```
    CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://medipredict-frontend.netlify.app,https://medi-predict-frontend.vercel.app,https://medipredict-backend.onrender.com,https://my-medipredict.com
    ```

These changes will ensure that your MediPredict application can be deployed and run in a production environment where the frontend and backend are on different networks.
