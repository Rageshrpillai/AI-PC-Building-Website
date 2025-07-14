// api/lib/middleware/requireAdmin.js

// No direct import of clerkClient needed here anymore
// as we will access it via req.clerk.users.getUser

const requireAdmin = async (req, res, next) => {
  // Corrected: Call req.auth() as a function
  const auth = req.auth();

  if (!auth || !auth.userId) {
    // Check the result of the function call
    console.warn(
      "requireAdmin: Unauthorized access attempt - No user ID in auth context."
    );
    return res
      .status(401)
      .json({ error: "Unauthorized: Authentication required." });
  }

  // Ensure req.clerk is available (populated by clerkMiddleware from @clerk/express)
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

  try {
    const user = await req.clerk.users.getUser(auth.userId); // Corrected: Use auth.userId

    if (user.publicMetadata?.role === "admin") {
      console.log(`requireAdmin: User ${auth.userId} is an admin. Proceeding.`); // Corrected: Use auth.userId
      next();
    } else {
      console.warn(
        `requireAdmin: Forbidden access for user ${auth.userId} - Not an admin.`
      ); // Corrected: Use auth.userId
      res.status(403).json({ error: "Forbidden: Admin access required." });
    }
  } catch (error) {
    console.error(
      "Error in requireAdmin middleware during user lookup:",
      error
    );
    res
      .status(500)
      .json({ error: "Internal Server Error during admin check." });
  }
};

export default requireAdmin;
