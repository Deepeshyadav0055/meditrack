export default function LoadingSkeleton({ type = 'card', count = 1 }) {
    const renderCardSkeleton = () => (
        <div className="card animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
    );

    const renderTableSkeleton = () => (
        <div className="card animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStatSkeleton = () => (
        <div className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
        </div>
    );

    if (type === 'table') {
        return renderTableSkeleton();
    }

    if (type === 'stat') {
        return (
            <>
                {[...Array(count)].map((_, i) => (
                    <div key={i}>{renderStatSkeleton()}</div>
                ))}
            </>
        );
    }

    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div key={i}>{renderCardSkeleton()}</div>
            ))}
        </>
    );
}
