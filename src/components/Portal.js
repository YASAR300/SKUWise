"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => {
            cancelAnimationFrame(frame);
            setMounted(false);
        };
    }, []);

    return mounted ? createPortal(children, document.body) : null;
}
