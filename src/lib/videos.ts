// ─── Curated property walkthrough video clips (royalty-free from Mixkit) ──
// Direct MP4 CDN links — no auth, no redirect, play natively in <video>.
// Replace with your own CDN or listing-specific videos in production.

const PROPERTY_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-modern-living-room-with-large-windows-45657-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-luxury-home-interior-with-a-lounge-area-4023-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-residential-building-at-sunset-42740-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-house-with-a-swimming-pool-on-a-summer-day-46652-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-modern-kitchen-with-island-and-lights-on-4813-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-luxury-residential-complex-42586-large.mp4",
];

/**
 * Returns a looping, muted, autoplay-safe video URL for a property card.
 * `seed` ensures different cards get different videos.
 */
export function getPropertyVideo(seed: number = 0): string {
  return PROPERTY_VIDEOS[seed % PROPERTY_VIDEOS.length];
}

