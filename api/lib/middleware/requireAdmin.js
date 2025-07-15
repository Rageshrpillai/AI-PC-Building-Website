// api/lib/middleware/requireAdmin.js

import { clerkClient } from "@clerk/clerk-sdk-node"; // <--- ADD THIS IMPORT

const requireAdmin = async (req, res, next) => {
  const auth = req.auth(); // Get the auth object from clerkMiddleware

  if (!auth || !auth.userId) {
    console.warn(
      "requireAdmin: Unauthorized access attempt - No user ID in auth context."
    );
    return res
      .status(401)
      .json({ error: "Unauthorized: Authentication required." });
  }

  // The check for req.clerk.users.getUser is no longer needed here
  // because we are directly importing and using clerkClient.
  // This block can be removed or modified if you still want some debug check
  // for general req.clerk availability, but it's not the source of the getUser error.
  /*
  if (!req.clerk || !req.clerk.users || !req.clerk.users.getUser) {
    console.error(
      "requireAdmin: req.clerk.users.getUser not available. Check clerkMiddleware setup."
    );
    return res
      .status(500)
      .json({
        error: "Server misconfiguration: Clerk users API not available.",
      });
  }
  */

  try {
    // CORRECTED: Use the imported clerkClient to fetch the user
    const user = await clerkClient.users.getUser(auth.userId);

    if (user.publicMetadata?.role === "admin") {
      console.log(`requireAdmin: User ${auth.userId} is an admin. Proceeding.`);
      next();
    } else {
      console.warn(
        `requireAdmin: Forbidden access for user ${auth.userId} - Not an admin.`
      );
      res.status(403).json({ error: "Forbidden: Admin access required." });
    }
  } catch (error) {
    console.error(
      "Error in requireAdmin middleware during user lookup:",
      error
    );
    // Be careful not to expose too much error detail in production
    res
      .status(500)
      .json({ error: "Internal Server Error during admin check." });
  }
};

export default requireAdmin;
