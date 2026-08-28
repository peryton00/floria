// Floria ImageEngine — Typed Domain Errors

export class ImageEngineError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "IMAGE_ENGINE_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmptyInputError extends ImageEngineError {
  constructor(message: string = "Input file buffer is empty") {
    super(message, "EMPTY_INPUT");
  }
}

export class FileTooLargeError extends ImageEngineError {
  constructor(
    message: string = "Input file size exceeds maximum limit of 10 MB",
  ) {
    super(message, "FILE_TOO_LARGE");
  }
}

export class UnsupportedFormatError extends ImageEngineError {
  constructor(format: string) {
    super(
      `Unsupported or unreadable image format: '${format}'`,
      "UNSUPPORTED_FORMAT",
    );
  }
}

export class ExcessiveDimensionsError extends ImageEngineError {
  constructor(width: number, height: number) {
    super(
      `Image dimensions (${width}x${height}) exceed maximum allowed 16,384 x 16,384`,
      "EXCESSIVE_DIMENSIONS",
    );
  }
}

export class PixelLimitExceededError extends ImageEngineError {
  constructor(totalPixels: number) {
    super(
      `Image pixel count (${totalPixels}) exceeds maximum allowed 268,435,456 pixels`,
      "PIXEL_LIMIT_EXCEEDED",
    );
  }
}

export class CorruptImageError extends ImageEngineError {
  constructor(details?: string) {
    super(
      `Image file is corrupt or header could not be decoded${details ? `: ${details}` : ""}`,
      "CORRUPT_IMAGE",
    );
  }
}

export class ProcessingFailureError extends ImageEngineError {
  constructor(variantName: string, originalError?: Error) {
    super(
      `Failed to process variant '${variantName}'${originalError ? `: ${originalError.message}` : ""}`,
      "PROCESSING_FAILURE",
    );
  }
}
