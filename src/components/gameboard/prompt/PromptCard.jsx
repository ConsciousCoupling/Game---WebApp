import { useEffect, useRef, useState } from "react";

import "./PromptCard.css";

function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return "";
  }

  const preferred = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  return preferred.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

export default function PromptCard({
  prompt,
  currentPlayerName,
  otherPlayerName,
  isResponder,
  isReviewer,
  onSubmitResponse,
  onReadyToRate,
}) {
  const [draftText, setDraftText] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const [responseError, setResponseError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const promptText = prompt?.text || prompt?.prompt || "";
  const category = prompt?.category;
  const reversed = !!prompt?.reversed;
  const deepen = !!prompt?.deepen;
  const bonusTokens = Number(prompt?.bonusTokens || 0);
  const response = prompt?.response || null;
  const responderName = reversed ? otherPlayerName : currentPlayerName;
  const reviewerName = reversed ? currentPlayerName : otherPlayerName;
  const hasSubmittedResponse = !!(
    response &&
    (response.type === "live" || response.text || response.audioUrl)
  );

  useEffect(() => {
    if (!hasSubmittedResponse) {
      setDraftText("");
    }
  }, [promptText, hasSubmittedResponse]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordedAudioUrl]);

  if (!prompt) return null;

  function resetLocalRecording() {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }

    setRecordedAudioBlob(null);
    setRecordedAudioUrl("");
  }

  async function startRecording() {
    if (isRecording || isSubmitting) return;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window.MediaRecorder === "undefined"
    ) {
      setRecordingError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      setRecordingError("");
      setResponseError("");
      resetLocalRecording();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);

        if (blob.size === 0) {
          setRecordingError("No audio was captured. Please try again.");
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(nextUrl);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start audio recording:", error);
      setRecordingError("Microphone access was denied or unavailable.");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    mediaRecorderRef.current.stop();
  }

  async function handleSubmit(type = "text") {
    if (!onSubmitResponse || isSubmitting) return;

    const trimmedText = draftText.trim();

    if (type !== "live" && !trimmedText && !recordedAudioBlob) {
      setResponseError("Add a text response, record audio, or mark it as answered live.");
      return;
    }

    setIsSubmitting(true);
    setResponseError("");

    try {
      await onSubmitResponse({
        type,
        text: type === "live" ? "" : trimmedText,
        audioBlob: type === "live" ? null : recordedAudioBlob,
      });
      resetLocalRecording();
      setDraftText("");
    } catch (error) {
      console.error("Failed to submit prompt response:", error);
      setResponseError("Could not send your response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="prompt-card">
      <h2 className="prompt-title">
        Category {category}
      </h2>

      <p className="prompt-text">{promptText}</p>

      {(reversed || deepen || bonusTokens > 0) && (
        <div className="prompt-modifiers">
          {reversed && (
            <div className="modifier reversed">
              Turn It Around
              <span>{responderName} answers this one.</span>
            </div>
          )}

          {deepen && (
            <div className="modifier deepen">
              Go On
              <span>Give a deeper answer. Rewards are doubled.</span>
            </div>
          )}

          {bonusTokens > 0 && (
            <div className="modifier deepen">
              Ask Me Anything
              <span>Answer openly to earn +{bonusTokens} bonus tokens.</span>
            </div>
          )}
        </div>
      )}

      <div className="prompt-instructions">
        <strong>{responderName}</strong> answers this prompt.
        <strong> {reviewerName}</strong> reviews it and then rates the effort.
      </div>

      {hasSubmittedResponse && (
        <div className="prompt-response-display">
          <div className="prompt-response-title">
            {response.responderName || responderName}'s response
          </div>

          {response.type === "live" && (
            <p className="prompt-response-live">
              Marked as answered live or off-app.
            </p>
          )}

          {response.text && (
            <p className="prompt-response-text">{response.text}</p>
          )}

          {response.audioUrl && (
            <audio
              className="prompt-response-audio"
              controls
              src={response.audioUrl}
              preload="metadata"
            />
          )}
        </div>
      )}

      {isResponder && !hasSubmittedResponse && (
        <div className="prompt-response-editor">
          <label className="prompt-response-label" htmlFor="prompt-response-text">
            Send a reply for your partner
          </label>

          <textarea
            id="prompt-response-text"
            className="prompt-response-textarea"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            placeholder="Type your answer here, record a voice note, or answer live."
          />

          <div className="prompt-recorder-row">
            {isRecording ? (
              <button
                className="prompt-secondary-btn"
                onClick={stopRecording}
                disabled={isSubmitting}
              >
                Stop Recording
              </button>
            ) : (
              <button
                className="prompt-secondary-btn"
                onClick={startRecording}
                disabled={isSubmitting}
              >
                Record Voice Note
              </button>
            )}

            {recordedAudioBlob && !isRecording && (
              <button
                className="prompt-tertiary-btn"
                onClick={resetLocalRecording}
                disabled={isSubmitting}
              >
                Clear Audio
              </button>
            )}
          </div>

          {recordedAudioUrl && (
            <audio
              className="prompt-response-audio preview"
              controls
              src={recordedAudioUrl}
              preload="metadata"
            />
          )}

          {recordingError && (
            <div className="prompt-inline-error">{recordingError}</div>
          )}

          {responseError && (
            <div className="prompt-inline-error">{responseError}</div>
          )}

          <div className="prompt-response-actions">
            <button
              className="prompt-tertiary-btn"
              onClick={() => handleSubmit("live")}
              disabled={isSubmitting || isRecording}
            >
              {isSubmitting ? "Sending…" : "Answered Live"}
            </button>

            <button
              className="prompt-primary-btn"
              onClick={() => handleSubmit("text")}
              disabled={isSubmitting || isRecording}
            >
              {isSubmitting ? "Sending…" : "Send Response"}
            </button>
          </div>
        </div>
      )}

      {isResponder && hasSubmittedResponse && (
        <div className="prompt-status-note">
          Waiting for {reviewerName} to review your response.
        </div>
      )}

      {isReviewer && !hasSubmittedResponse && (
        <div className="prompt-status-note">
          Waiting for {responderName} to answer this prompt.
        </div>
      )}

      {isReviewer && hasSubmittedResponse && (
        <button className="prompt-primary-btn ready" onClick={onReadyToRate}>
          Ready to Rate
        </button>
      )}
    </div>
  );
}
