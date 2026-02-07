import Pusher from "pusher";

// Lazy initialization to avoid errors when env vars are missing during build
let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher | null {
  if (pusherInstance) {
    return pusherInstance;
  }

  const appId = process.env.PUSHER_APP_ID;
  // Use NEXT_PUBLIC_PUSHER_KEY since Pusher key is public (same value for client & server)
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn("Pusher env vars not configured, realtime features disabled");
    return null;
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherInstance;
}

// Helper to trigger events with error handling
export async function triggerEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<void> {
  const pusher = getPusher();
  if (!pusher) {
    return; // Silently skip if Pusher not configured
  }

  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error("Pusher trigger error:", error);
    // Don't throw - realtime is non-critical
  }
}
