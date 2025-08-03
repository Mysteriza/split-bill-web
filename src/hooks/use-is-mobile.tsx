"use client";

import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 640) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Ensure window is defined (for server-side rendering)
        if (typeof window === "undefined") return;

        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [breakpoint]);

    return isMobile;
};