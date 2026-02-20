
export const UnifiedBackground = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200/40 dark:bg-blue-600/20 rounded-full blur-[100px] dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-200/40 dark:bg-purple-600/20 rounded-full blur-[100px] dark:mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />
        </div>
    );
};
