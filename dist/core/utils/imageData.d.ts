/** Normalise inline images without loading an image codec or changing image bytes. */
export declare function parseInlineImage(image: string, declaredMime?: string): {
    data: string;
    mimeType: string;
};
