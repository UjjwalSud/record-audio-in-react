**Audio Recording Demo using React and TypeScript**
---

This project showcases a custom audio recording API integrated into a React application, utilizing TypeScript for type safety and enhanced development experience. The implementation is based on the audio recording API detailed [here](https://github.com/ralzohairi/js-audio-recording?).

**Key Features:**

1. **Audio Recording:** Users can initiate audio recording sessions.
2. **Stop Recording:** Recording sessions automatically halt after one hour or can be manually stopped.
3. **Playback:** Users can listen to the recorded audio after stopping the recording.
4. **Cancel Recording:** Users can cancel ongoing recording sessions.

**Use Cases:**

- **Starting the Audio Recording:** To start recording, users click on the microphone icon. The recording begins upon user permission and in the absence of any errors. The elapsed recording time is displayed alongside buttons to stop or cancel the recording.
  
- **Stopping the Audio Recording:** Users stop the recording by clicking the stop button. After successful recording termination, the recorded audio is played back to the user.

- **Cancelling the Audio Recording:** Users can cancel an ongoing recording session by clicking the cancel button.

**Handling Unsupported Browsers:**

When attempting to initiate recording in an unsupported browser, users are presented with a message box explaining why the audio recording feature is unavailable.
