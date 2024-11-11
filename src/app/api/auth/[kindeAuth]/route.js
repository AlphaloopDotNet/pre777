import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";

export const GET = handleAuth();

export const POST = withKindeAuth(async (req, res) => {
  noStore();
  const { email, password } = req.body;
  try {
    // Login the user
    const user = await req.kinde.auth.signInWithEmailAndPassword(
      email,
      password
    );

    // Check if the user is already logged in on another device
    const isLoggedIn = await isUserLoggedIn(email);
    if (isLoggedIn) {
      // Log out the user from other devices
      await logoutUserFromOtherDevices(email);
    }

    // Generate a session token and return it in the response
    const sessionToken = await req.kinde.auth.createSessionToken(user.uid);
    res.status(200).json({ loggedIn: true, sessionToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid email or password" });
  }
});

const isUserLoggedIn = async (email) => {
  try {
    const { data } = await req.kinde.firestore
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    return data.length > 0 && data[0].isLoggedIn;
  } catch (err) {
    throw new Error("Error checking login status");
  }
};

const logoutUserFromOtherDevices = async (email) => {
  try {
    await req.kinde.firestore
      .collection("users")
      .where("email", "==", email)
      .update({ isLoggedIn: false });
  } catch (err) {
    throw new Error("Error logging out user from other devices");
  }
};
