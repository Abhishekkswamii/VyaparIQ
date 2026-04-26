export default function ProductSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Image skeleton — matches aspect-[4/3] */}
      <div className="skeleton-shimmer aspect-[4/3] w-full" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Category */}
        <div className="skeleton-shimmer mb-1 h-2.5 w-14 rounded-full" />
        {/* Name — 2-line reserved slot */}
        <div className="mb-1.5 min-h-[2.5rem] space-y-1.5">
          <div className="skeleton-shimmer h-3.5 w-full rounded-md" />
          <div className="skeleton-shimmer h-3.5 w-3/4 rounded-md" />
        </div>
        {/* Rating — fixed h-4 slot */}
        <div className="skeleton-shimmer mb-2 h-4 w-24 rounded-full" />

        <div className="mt-auto">
          {/* Price */}
          <div className="skeleton-shimmer mb-2 h-5 w-20 rounded-md" />
          {/* Badge slot */}
          <div className="mb-2 h-5" />
          {/* Cheaper alt slot */}
          <div className="mb-2.5 h-8" />
          {/* Button */}
          <div className="skeleton-shimmer h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
