import PusherClient from "pusher-js";

// Singleton instance
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  // Only run on client side
  if (typeof window === "undefined") {
    return null;
  }

  if (pusherClient) {
    return pusherClient;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn("Pusher client env vars not configured");
    return null;
  }

  pusherClient = new PusherClient(key, {
    cluster,
  });

  return pusherClient;
}

// Helper to subscribe to a channel
export function subscribeToChannel(channelName: string) {
  const client = getPusherClient();
  if (!client) {
    return null;
  }
  return client.subscribe(channelName);
}

// Helper to unsubscribe from a channel
export function unsubscribeFromChannel(channelName: string) {
  const client = getPusherClient();
  if (!client) {
    return;
  }
  client.unsubscribe(channelName);
}
