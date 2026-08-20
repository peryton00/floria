"use strict";
// Floria ImageEngine — Typed Domain Errors
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingFailureError = exports.CorruptImageError = exports.PixelLimitExceededError = exports.ExcessiveDimensionsError = exports.UnsupportedFormatError = exports.FileTooLargeError = exports.EmptyInputError = exports.ImageEngineError = void 0;
class ImageEngineError extends Error {
    code;
    constructor(message, code = "IMAGE_ENGINE_ERROR") {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ImageEngineError = ImageEngineError;
class EmptyInputError extends ImageEngineError {
    constructor(message = "Input file buffer is empty") {
        super(message, "EMPTY_INPUT");
    }
}
exports.EmptyInputError = EmptyInputError;
class FileTooLargeError extends ImageEngineError {
    constructor(message = "Input file size exceeds maximum limit of 10 MB") {
        super(message, "FILE_TOO_LARGE");
    }
}
exports.FileTooLargeError = FileTooLargeError;
class UnsupportedFormatError extends ImageEngineError {
    constructor(format) {
        super(`Unsupported or unreadable image format: '${format}'`, "UNSUPPORTED_FORMAT");
    }
}
exports.UnsupportedFormatError = UnsupportedFormatError;
class ExcessiveDimensionsError extends ImageEngineError {
    constructor(width, height) {
        super(`Image dimensions (${width}x${height}) exceed maximum allowed 16,384 x 16,384`, "EXCESSIVE_DIMENSIONS");
    }
}
exports.ExcessiveDimensionsError = ExcessiveDimensionsError;
class PixelLimitExceededError extends ImageEngineError {
    constructor(totalPixels) {
        super(`Image pixel count (${totalPixels}) exceeds maximum allowed 268,435,456 pixels`, "PIXEL_LIMIT_EXCEEDED");
    }
}
exports.PixelLimitExceededError = PixelLimitExceededError;
class CorruptImageError extends ImageEngineError {
    constructor(details) {
        super(`Image file is corrupt or header could not be decoded${details ? `: ${details}` : ""}`, "CORRUPT_IMAGE");
    }
}
exports.CorruptImageError = CorruptImageError;
class ProcessingFailureError extends ImageEngineError {
    constructor(variantName, originalError) {
        super(`Failed to process variant '${variantName}'${originalError ? `: ${originalError.message}` : ""}`, "PROCESSING_FAILURE");
    }
}
exports.ProcessingFailureError = ProcessingFailureError;
