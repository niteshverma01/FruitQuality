import * as FileSystem from "expo-file-system/legacy";
import { NativeModules, Platform } from "react-native";

export type PredictResponse = {
  prediction: string;
  confidence: number;
  fruit?: string;
  quality?: string;
  recognized?: boolean;
  recognized_quality?: boolean;
  quality_confidence?: number;
  message?: string;
};

function getMetroHost(): string | null {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;

  const match = scriptURL.match(/^(?:https?:\/\/|exp:\/\/)([^:\/\?#]+)(?::\d+)?/i);
  return match?.[1] ?? null;
}

export function getDefaultApiBaseUrl(): string {
  // Hardcoded to always use the specific backend IP requested
  return "http://10.126.221.232:5000";
}

export async function pingApi(baseUrl: string): Promise<void> {
  const apiBaseUrl = baseUrl.trim().replace(/\/$/, "");
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${apiBaseUrl}/`, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API reachable but returned ${res.status} from /`);
  } catch {
    throw new Error(
      `Cannot reach API at ${apiBaseUrl}.\n` +
        `- Start Flask: python app.py\n` +
        `- Use your PC LAN IP (not localhost) on Android phone\n` +
        `- Allow port 5000 through Windows Firewall`
    );
  }
}

export async function predictImage(params: {
  uri: string;
  mimeType?: string;
  filename?: string;
  baseUrl: string;
}): Promise<PredictResponse> {
  const apiBaseUrl = params.baseUrl.trim().replace(/\/$/, "");
  const url = `${apiBaseUrl}/predict`;
  const mimeType = params.mimeType ?? "image/jpeg";
  const filename = params.filename ?? "image.jpg";

  let fileUri = params.uri;
  if (Platform.OS === "android" && fileUri.startsWith("content://")) {
    const dest = `${FileSystem.cacheDirectory ?? ""}${Date.now()}-${filename}`;
    await FileSystem.copyAsync({ from: fileUri, to: dest });
    fileUri = dest;
  }

  let status: number;
  let bodyText: string;
  try {
    const uploadRes = await FileSystem.uploadAsync(url, fileUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file",
      mimeType,
      parameters: {
        filename
      }
    });
    status = uploadRes.status;
    bodyText = uploadRes.body ?? "";
  } catch {
    throw new Error(
      `Network error calling ${url}.\n` +
        `- Use your PC LAN IP in API base URL (not 127.0.0.1) on a real phone\n` +
        `- Ensure Flask is running and Windows Firewall allows port 5000`
    );
  }

  let data: any;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error(`Non-JSON response (${status}): ${bodyText.slice(0, 200)}`);
  }

  if (status < 200 || status >= 300) {
    const msg = data?.error ?? "Request failed";
    const detail = data?.detail ? ` (${data.detail})` : "";
    throw new Error(`${msg}${detail}`);
  }

  return data as PredictResponse;
}

