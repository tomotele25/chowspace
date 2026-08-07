import { getServerSession } from "next-auth/next";
import { nextOptions } from "@/pages/api/auth/[...nextauth]";

/**
 * Server-side gate for the admin pages.
 *
 * Every /admin page checked the session in a `useEffect` and redirected from
 * there. Two problems with that: the redirect fires after the page has already
 * rendered and after its data-fetching effects have queued, and the check was
 * usually "is anyone logged in" rather than "is this an admin" — so any
 * customer account reached the admin UI.
 *
 * This runs before a byte of HTML is sent, so a non-admin never receives the
 * markup at all.
 *
 * It is not a substitute for the API guards — a page is only as private as the
 * endpoints it calls, and those are guarded separately by requireRole on the
 * backend. This stops the admin interface itself being handed out.
 *
 * Usage, at the bottom of an admin page:
 *
 *   export const getServerSideProps = requireAdminPage();
 */
export function requireAdminPage(getProps) {
  return async function getServerSideProps(context) {
    const session = await getServerSession(
      context.req,
      context.res,
      nextOptions,
    );

    if (!session?.user) {
      return {
        redirect: {
          destination: `/Login?next=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    if (session.user.role !== "admin") {
      // Deliberately home rather than an "access denied" page: telling someone
      // they found the admin area is more than they need to know.
      return { redirect: { destination: "/", permanent: false } };
    }

    return getProps ? getProps(context, session) : { props: {} };
  };
}
