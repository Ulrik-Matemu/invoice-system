import { clsx } from "clsx";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
    return (
        <div
            className={clsx("animate-pulse rounded-xl bg-white/5", className)}
            {...props}
        />
    );
};

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-8">
            <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl h-40 flex flex-col justify-between animate-pulse">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-white/5" />
                            <div className="w-20 h-4 rounded-lg bg-white/5" />
                        </div>
                        <div className="space-y-2">
                            <div className="w-24 h-8 rounded-lg bg-white/5" />
                            <div className="w-32 h-4 rounded-lg bg-white/5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl h-[300px] animate-pulse">
                    <div className="w-40 h-6 rounded-lg bg-white/5 mb-8" />
                    <div className="flex items-end gap-4 h-[200px]">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex-1 bg-white/5 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                        ))}
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-3xl h-[300px] animate-pulse">
                    <div className="w-32 h-6 rounded-lg bg-white/5 mb-8" />
                    <div className="flex justify-center items-center h-[200px]">
                        <div className="w-40 h-40 rounded-full border-8 border-white/5" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InvoicesSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-8 w-32 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 w-24 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>

            {/* Search Bar */}
            <div className="h-12 w-full max-w-md bg-white/5 rounded-2xl animate-pulse" />

            {/* Invoice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl h-48 animate-pulse flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/5" />
                                <div className="space-y-2">
                                    <div className="w-24 h-5 rounded-lg bg-white/5" />
                                    <div className="w-16 h-4 rounded-lg bg-white/5" />
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-white/5" />
                        </div>
                        <div className="w-32 h-8 rounded-lg bg-white/5" />
                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <div className="w-20 h-4 rounded-lg bg-white/5" />
                            <div className="w-16 h-6 rounded-full bg-white/5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
