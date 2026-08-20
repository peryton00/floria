// Floria Media Infrastructure — API Types & Schemas
import type { ImageProfileName } from "./image-engine/image-engine.types.js";

export type UploadSessionState =
  | "CREATED"
  | "UPLOADING"
  | "UPLOADED"
  | "COMPLETED"
  | "EXPIRED"
  | "ABANDONED"
  | "FAILED";

export interface CreateSessionInput {
  profile: ImageProfileName;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadSessionDto {
  sessionId: string;
  assetId: string;
  status: UploadSessionState;
  profile: ImageProfileName;
  expiresAt: string;
  bucket: string;
  stagingPath: string;
  upload: {
    method: "PUT";
    url: string;
    token?: string | null;
  };
}

export interface CompleteSessionDto {
  sessionId: string;
  assetId: string;
  sessionStatus: UploadSessionState;
  assetStatus: string;
  deduplicated?: boolean;
}

export interface UploadSessionStatusDto {
  sessionId: string;
  assetId: string | null;
  sessionStatus: UploadSessionState;
  assetStatus: string;
  profile: ImageProfileName;
  createdAt: string;
  completedAt: string | null;
  failureReason?: string;
  variants: Record<string, string>;
}
