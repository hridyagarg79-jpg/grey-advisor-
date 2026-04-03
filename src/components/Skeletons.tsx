/**
 * PropertyCardSkeleton — shimmer placeholder while listings load.
 * Mirrors the exact layout of a real property card.
 */
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Image area */}
      <div className="h-44 shimmer" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-3/5 shimmer rounded-lg" />
          <div className="h-4 w-1/4 shimmer rounded-lg" />
        </div>
        <div className="h-3 w-2/5 shimmer rounded-lg" />
        <div className="h-px bg-stone-50 my-2" />
        <div className="flex justify-between">
          <div className="h-3 w-1/3 shimmer rounded-lg" />
          <div className="h-3 w-1/4 shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProfileCardSkeleton — for profile/wishlist loading states
 */
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-2/3 shimmer rounded-lg" />
        <div className="h-4 w-1/5 shimmer rounded-lg" />
      </div>
      <div className="h-3 w-2/5 shimmer rounded-lg" />
      <div className="h-px bg-stone-50" />
      <div className="flex justify-between">
        <div className="h-3 w-1/4 shimmer rounded-lg" />
        <div className="h-6 w-6 shimmer rounded-full" />
      </div>
    </div>
  );
}
