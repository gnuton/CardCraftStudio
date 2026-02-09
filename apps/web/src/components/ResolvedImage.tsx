import { useState, useEffect, type CSSProperties } from 'react';
import { imageService } from '../services/imageService';
import { Loader2 } from 'lucide-react';

interface CardImageProps {
    src: string | null;
    alt: string;
    className?: string;
    style?: CSSProperties;
    draggable?: boolean;
}

export const ResolvedImage = ({ src, alt, className, style, draggable }: CardImageProps) => {
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!src) {
            setResolvedSrc(null);
            return;
        }

        if (!src.startsWith('ref:')) {
            setResolvedSrc(src);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        imageService.resolveImage(src).then((resolved) => {
            if (isMounted) {
                setResolvedSrc(resolved);
                setIsLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, [src]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded ${className}`} style={style}>
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!resolvedSrc) return null;

    return <img src={resolvedSrc} alt={alt} className={className} style={style} draggable={draggable} />;
};
