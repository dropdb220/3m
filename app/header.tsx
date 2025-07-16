'use client';
import { useEffect } from "react";

export default function Header() {
    useEffect(() => {
        if (navigator.userAgent.includes('KAKAO')) {
            location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
        }
    }, []);

    return <></>;
}