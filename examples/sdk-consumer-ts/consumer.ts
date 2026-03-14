import {
    createWatermarkEngine,
    removeWatermarkFromImageDataSync,
    type ImageDataLike
} from 'gemini-watermark-remover';
import {
    inferMimeTypeFromPath,
    type NodeBufferRemovalOptions
} from 'gemini-watermark-remover/node';

const imageData: ImageDataLike = {
    width: 64,
    height: 64,
    data: new Uint8ClampedArray(64 * 64 * 4)
};

const enginePromise = createWatermarkEngine();
const result = removeWatermarkFromImageDataSync(imageData, {
    adaptiveMode: 'never',
    maxPasses: 1
});
const mimeType = inferMimeTypeFromPath('demo.png');

const options: NodeBufferRemovalOptions = {
    mimeType,
    decodeImageData() {
        return imageData;
    },
    encodeImageData() {
        return Buffer.from([]);
    }
};

void enginePromise;
void result.meta;
void options;
