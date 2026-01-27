import { useEffect } from 'react';

export const useProctoring = (onViolation) => {
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                onViolation('Tab Switch / Minimize Detected');
            }
        };

        const handleBlur = () => {
            onViolation('Window Focus Lost');
        };

        const handleKeyDown = (e) => {
            // Allow Ctrl+C (Copy), Ctrl+V (Paste) and other common shortcuts
            // No longer blocking paste
        };

        const preventCut = (e) => {
            e.preventDefault();
            onViolation('Cut Attempted');
        };

        const preventContextMenu = (e) => {
            e.preventDefault();
            onViolation('Right Click Attempted');
        };

        // Visibility API
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        // Prevent Shortcuts
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', preventContextMenu);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', preventContextMenu);
        };
    }, [onViolation]);
};
