// Generate a VAPID keypair for web push (Batch 5 Stage D).
//   node scripts/gen-vapid.mjs
// Then set in the environment / Vercel:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY = <publicKey>
//   VAPID_PRIVATE_KEY            = <privateKey>
//   VAPID_SUBJECT                = mailto:you@example.com   (optional)
//   SUPABASE_SERVICE_ROLE_KEY    = <service role key>       (for push fan-out)
//   CRON_SECRET                  = <random string>          (for /api/push/cron)
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
