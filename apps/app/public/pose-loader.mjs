// Loaded directly by the browser; keeps MediaPipe's dynamic WASM imports out of Metro.
import * as vision from './mediapipe/vision_bundle.mjs';
globalThis.fitnessVision = vision;
