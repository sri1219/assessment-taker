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
            // Allow Ctrl+C (Copy), but prevent Paste if desired?
            // "It shouldn't be case of Ctrl+C" -> User implies Ctrl+C is fine.
            // We only block Paste (Ctrl+V) or maybe nothing if they want strictness reduced.
            // Let's block only Paste for now.
            if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
                e.preventDefault();
                onViolation('Copy/Paste Attempt');
            }
            // Alt+Tab simulation check usually done via blur, not keydown effectively
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
        // We only handle keys and context menu now.
        // Copy/Paste events specific handlers removed as we rely on KeyDown to filter keys.
        // Actually, 'paste' event is good to block right-click paste too.

        const handlePaste = (e) => {
            e.preventDefault();
            onViolation('Paste Attempt');
        };
        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('paste', handlePaste);
        };
    }, [onViolation]);
};
