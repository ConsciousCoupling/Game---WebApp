import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "./firebase";

function extensionFromMimeType(mimeType = "") {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "bin";
}

export async function uploadPromptAudio(gameId, blob, responderToken) {
  const mimeType = blob?.type || "audio/webm";
  const extension = extensionFromMimeType(mimeType);
  const path = [
    "gameplay",
    gameId,
    "prompt-audio",
    `${responderToken}-${Date.now()}.${extension}`,
  ].join("/");

  const audioRef = ref(storage, path);

  await uploadBytes(audioRef, blob, {
    contentType: mimeType,
  });

  const audioUrl = await getDownloadURL(audioRef);

  return {
    audioUrl,
    audioPath: path,
    audioMimeType: mimeType,
  };
}
