/**
 * Backend endpoints for the Chowspace frontend.
 *
 * Two hosts, deliberately:
 *
 *   BACKENDURL  — the REST API (Vercel). Everything HTTP goes here.
 *   SOCKET_URL  — realtime chat (Render). Only `io(...)` should use this;
 *                 Vercel is serverless and cannot hold a WebSocket open.
 *
 * The split is safe because no HTTP handler in the backend emits socket
 * events — realtime delivery happens entirely socket-to-socket inside
 * api/server.js, and both hosts share one database. If that ever changes,
 * the chat HTTP calls have to move back alongside the sockets.
 *
 * Set NEXT_PUBLIC_API_URL to point the whole app at a local backend.
 */
export const BACKENDURL =
  process.env.NEXT_PUBLIC_API_URL || "https://chowspace-backend.vercel.app";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://chowspace-backend-1.onrender.com";

export default BACKENDURL;
