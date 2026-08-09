import axios from "axios";

/**
 * Keeps bearer tokens out of anything that logs an axios error.
 *
 * An axios error carries the request that produced it, headers included. So
 * every `console.error(err)` in the app — there are roughly forty-five — was
 * printing the user's `Authorization: Bearer …` into the browser console
 * whenever a request failed. Anyone glancing at a vendor's open devtools, or
 * any script that wraps console, could read the token and act as them until
 * it expired.
 *
 * Fixed here rather than at the call sites for two reasons: forty-five edits
 * would be forty-five chances to miss one, and the next `console.error(err)`
 * someone writes is covered automatically.
 *
 * The interceptor rejects with the same error object, so existing `catch`
 * blocks and their `err.response.data` reads are unaffected — only the
 * credentials are stripped.
 */
export function installAxiosSafety() {
  if (axios.__chowspaceSafetyInstalled) return;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const headers = error?.config?.headers;
      if (headers) {
        delete headers.Authorization;
        delete headers.authorization;
      }
      return Promise.reject(error);
    },
  );

  axios.__chowspaceSafetyInstalled = true;
}
