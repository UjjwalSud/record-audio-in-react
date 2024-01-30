//API to handle audio recording
const audioRecorder: {
  audioBlobs: Blob[];
  mediaRecorder: MediaRecorder | null;
  streamBeingCaptured: MediaStream | null;
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
  stopStream: () => void;
  resetRecordingProperties: () => void;
} = {
  audioBlobs: [],
  mediaRecorder: null,
  streamBeingCaptured: null,
  start: function () {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      return Promise.reject(
        new Error(
          "mediaDevices API or getUserMedia method is not supported in this browser."
        )
      );
    } else {
      return navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream: MediaStream) => {
          audioRecorder.streamBeingCaptured = stream;
          audioRecorder.mediaRecorder = new MediaRecorder(stream);
          audioRecorder.audioBlobs = [];
          audioRecorder.mediaRecorder.addEventListener(
            "dataavailable",
            (event: BlobEvent) => {
              audioRecorder.audioBlobs.push(event.data);
            }
          );
          audioRecorder.mediaRecorder.start();
        });
    }
  },

  stop: function () {
    return new Promise<Blob>((resolve) => {
      if (!audioRecorder.mediaRecorder) {
        throw new Error("MediaRecorder not initialized");
      }
      let mimeType = audioRecorder.mediaRecorder.mimeType;
      audioRecorder.mediaRecorder.addEventListener("stop", () => {
        let audioBlob = new Blob(audioRecorder.audioBlobs, { type: mimeType });
        resolve(audioBlob);
      });
      audioRecorder.cancel();
    });
  },

  cancel: function () {
    if (audioRecorder.mediaRecorder) {
      audioRecorder.mediaRecorder.stop();
    }
    audioRecorder.stopStream();
    audioRecorder.resetRecordingProperties();
  },
  stopStream: function () {
    if (audioRecorder.streamBeingCaptured) {
      audioRecorder.streamBeingCaptured
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
    }
  },
  resetRecordingProperties: function () {
    audioRecorder.mediaRecorder = null;
    audioRecorder.streamBeingCaptured = null;
  },
};

export default audioRecorder;
