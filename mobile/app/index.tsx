import { Redirect } from "expo-router";

// The root layout's auth gate will redirect to sign-in when logged out.
export default function Index() {
  return <Redirect href="/(app)/home" />;
}
