export const getDominantColor = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve('#ffffff'); // Fallback
                    return;
                }

                // Resize for faster processing
                canvas.width = 50;
                canvas.height = 50;

                // Draw image to canvas
                ctx.drawImage(img, 0, 0, 50, 50);

                // Get image data
                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < imageData.length; i += 4) {
                    // Skip transparent or very white/black pixels if desired, 
                    // but for general average, just sum.
                    // Let's skip fully transparent pixels
                    if (imageData[i + 3] < 128) continue;

                    r += imageData[i];
                    g += imageData[i + 1];
                    b += imageData[i + 2];
                    count++;
                }

                if (count === 0) {
                    resolve('#ffffff');
                    return;
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                const toHex = (c: number) => {
                    const hex = c.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };

                resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
            } catch (e) {
                console.error("Error extracting color", e);
                resolve('#ffffff'); // Fallback on CORS error or other issue
            }
        };

        img.onerror = () => {
            resolve('#ffffff');
        };
    });
};

export const getPixelColor = (
    imageUrl: string,
    x: number,
    y: number,
    clientWidth: number,
    clientHeight: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve('#ffffff');
                    return;
                }

                ctx.drawImage(img, 0, 0);

                // Map client coordinates to natural image coordinates
                // We use object-fit: contain, so we need to account for the empty space (letterboxing)

                const imgAspect = img.naturalWidth / img.naturalHeight;
                const clientAspect = clientWidth / clientHeight;

                let renderWidth = clientWidth;
                let renderHeight = clientHeight;
                let offsetX = 0;
                let offsetY = 0;

                if (imgAspect > clientAspect) {
                    // Image is wider than container: constrained by width
                    renderWidth = clientWidth;
                    renderHeight = clientWidth / imgAspect;
                    offsetY = (clientHeight - renderHeight) / 2;
                } else {
                    // Image is taller than container: constrained by height
                    renderHeight = clientHeight;
                    renderWidth = clientHeight * imgAspect;
                    offsetX = (clientWidth - renderWidth) / 2;
                }

                // Adjust coordinates relative to the rendered image
                const relativeX = x - offsetX;
                const relativeY = y - offsetY;

                // Check if click is outside the image (in the letterbox)
                if (relativeX < 0 || relativeX > renderWidth || relativeY < 0 || relativeY > renderHeight) {
                    // Clicked on background, return transparent or fallback?
                    // Let's resolve 'transparent' or maybe the background color of the container?
                    // For now, resolve null or white.
                    resolve('#ffffff');
                    return;
                }

                // Map to natural coordinates
                const naturalX = Math.floor((relativeX / renderWidth) * img.naturalWidth);
                const naturalY = Math.floor((relativeY / renderHeight) * img.naturalHeight);

                const pixel = ctx.getImageData(naturalX, naturalY, 1, 1).data;
                const toHex = (c: number) => {
                    const hex = c.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };

                resolve(`#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`);

            } catch (e) {
                console.error("Error picking color", e);
                resolve('#ffffff');
            }
        };

        img.onerror = () => reject('Failed to load image');
    });
};
