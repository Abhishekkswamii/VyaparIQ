export default function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Image skeleton */}
      <div className="skeleton-shimmer h-52 w-full" />

      {/* Content skeleton */}
      <div className="flex flex-col gap-2.5 p-4">
        {/* Category label */}
        <div className="skeleton-shimmer h-3 w-16 rounded-full" />
        {/* Product name */}
        <div className="skeleton-shimmer h-4 w-full rounded-md" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
        {/* Rating */}
        <div className="skeleton-shimmer h-3 w-24 rounded-full" />
        {/* Price */}
        <div className="skeleton-shimmer h-5 w-20 rounded-md" />
        {/* Button */}
        <div className="skeleton-shimmer mt-1 h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}
