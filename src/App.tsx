import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faDownload,
  faMicrophone,
  faStopCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import audioRecorder from "./services/audioRecorder";

function App() {
  /** Stores the actual start time when an audio recording begins to take place to ensure elapsed time start time is accurate*/
  let audioRecordStartTime: Date;
  /** Stores the maximum recording time in hours to stop recording once maximum recording hour has been reached */
  const maximumRecordingTimeInHours = 1;

  /** Stores the reference of the setInterval function that controls the timer in audio recording*/
  const [elapsedTimeTimer, setElapsedTimeTimer] = useState<any>(null);

  const audioElement = useRef<HTMLAudioElement>(new Audio());
  const downloadElement = useRef<HTMLAnchorElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [displayDownloadLink, setDisplayDownloadLink] =
    useState<boolean>(false);
  const [
    displayBrowserNotSupportedOverlay,
    setDisplayBrowserNotSupportedOverlay,
  ] = useState<boolean>(false);

  const [elapsedTimeDuringAudioRecording, setElapsedTimeDuringAudioRecording] =
    useState<string>();

  const startAudioRecording = () => {
    setDisplayDownloadLink(false);
    //If a previous audio recording is playing, pause it
    const recorderAudioIsPlaying = !audioElement.current.paused; // the paused property tells whether the media element is paused or not

    if (recorderAudioIsPlaying) {
      audioElement.current.pause();
      //also hide the audio playing indicator displayed on the screen
      setIsPlaying(false);
    }

    audioRecorder
      .start()
      .then(() => {
        //on success

        //display control buttons to offer the functionality of stop and cancel
        setIsRecording(true);
      })
      .catch((error) => {
        //on error
        //No Browser Support Error
        if (
          error.message.includes(
            "mediaDevices API or getUserMedia method is not supported in this browser."
          )
        ) {
          console.log("To record audio, use browsers like Chrome and Firefox.");
          setDisplayBrowserNotSupportedOverlay(true);
        }
        //Error handling structure
        switch (error.name) {
          case "AbortError": //error from navigator.mediaDevices.getUserMedia
            console.log("An AbortError has occured.");
            break;
          case "NotAllowedError": //error from navigator.mediaDevices.getUserMedia
            console.log(
              "A NotAllowedError has occured. User might have denied permission."
            );
            break;
          case "NotFoundError": //error from navigator.mediaDevices.getUserMedia
            console.log("A NotFoundError has occured.");
            break;
          case "NotReadableError": //error from navigator.mediaDevices.getUserMedia
            console.log("A NotReadableError has occured.");
            break;
          case "SecurityError": //error from navigator.mediaDevices.getUserMedia or from the MediaRecorder.start
            console.log("A SecurityError has occured.");
            break;
          case "TypeError": //error from navigator.mediaDevices.getUserMedia
            console.log("A TypeError has occured.");
            break;
          case "InvalidStateError": //error from the MediaRecorder.start
            console.log("An InvalidStateError has occured.");
            break;
          case "UnknownError": //error from the MediaRecorder.start
            console.log("An UnknownError has occured.");
            break;
          default:
            console.log("An error occured with the error name " + error.name);
        }
      });
  };

  const cancelAudioRecording = () => {
    audioRecorder.cancel();
    setIsPlaying(false);
    setIsRecording(false);
  };

  const stopAudioRecording = () => {
    audioRecorder
      .stop()
      .then((audioAsblob) => {
        //Play recorder audio
        playAudio(audioAsblob);
        //hide recording control button & return record icon
        setIsRecording(false);
        setDisplayDownloadLink(true);
      })
      .catch((error) => {
        //Error handling structure
        switch (error.name) {
          case "InvalidStateError": //error from the MediaRecorder.stop
            console.log("An InvalidStateError has occured.");
            break;
          default:
            console.log("An error occured with the error name " + error.name);
        }
      });
  };

  const playAudio = (recorderAudioAsBlob: Blob) => {
    //read content of files (Blobs) asynchronously
    const reader = new FileReader();
    //once content has been read
    reader.onload = (e) => {
      if (!e || !e.target) {
        return;
      }
      //store the base64 URL that represents the URL of the recording audio
      const base64URL = e.target.result as string;
      //set the audio element's source using the base64 URL
      audioElement.current.src = base64URL;

      //call the load method as it is used to update the audio element after changing the source or other settings
      audioElement.current.load();
      //play the audio after successfully setting new src and type that corresponds to the recorded audio
      audioElement.current.play();
      //Display text indicator of having the audio play in the background
      setIsPlaying(true);
      if (downloadElement && downloadElement.current) {
        downloadElement.current.href = base64URL;
        downloadElement.current.download = "myfile.mp3";
      }
    };
    //read content and convert it to a URL (base64)
    reader.readAsDataURL(recorderAudioAsBlob);
  };

  const audioElementEnded = () => {
    setIsPlaying(false);
    setIsRecording(false);
  };

  useEffect(() => {
    if (isRecording) {
      //store the recording start time to display the elapsed time according to it
      audioRecordStartTime = new Date();
      handleElapsedRecordingTime();
    } else {
      clearInterval(elapsedTimeTimer);
      setElapsedTimeTimer(null);
    }
  }, [isRecording]);

  /** Computes the elapsed recording time since the moment the function is called in the format h:m:s*/
  const handleElapsedRecordingTime = () => {
    //display inital time when recording begins
    displayElapsedTimeDuringAudioRecording("00:00");
    //create an interval that compute & displays elapsed time, as well as, animate red dot - every second
    let tempElapsedTimeTimer = setInterval(() => {
      //compute the elapsed time every second
      const elapsedTime = computeElapsedTime(audioRecordStartTime); //pass the actual record start time
      //display the elapsed time
      displayElapsedTimeDuringAudioRecording(elapsedTime);
    }, 1000); //every second
    setElapsedTimeTimer(tempElapsedTimeTimer);
  };

  /** Display elapsed time during audio recording
   * @param {String} elapsedTime - elapsed time in the format mm:ss or hh:mm:ss
   */
  const displayElapsedTimeDuringAudioRecording = (elapsedTime: string) => {
    //1. display the passed elapsed time as the elapsed time in the elapsedTime HTML element
    setElapsedTimeDuringAudioRecording(elapsedTime);
    //2. Stop the recording when the max number of hours is reached
    if (elapsedTimeReachedMaximumNumberOfHours(elapsedTime)) {
      stopAudioRecording();
    }
  };

  /**
   * @param {String} elapsedTime - elapsed time in the format mm:ss or hh:mm:ss
   * @returns {Boolean} whether the elapsed time reached the maximum number of hours or not
   */
  const elapsedTimeReachedMaximumNumberOfHours = (elapsedTime: string) => {
    //Split the elapsed time by the symbo :
    const elapsedTimeSplitted = elapsedTime.split(":");
    //Turn the maximum recording time in hours to a string and pad it with zero if less than 10
    const maximumRecordingTimeInHoursAsString =
      maximumRecordingTimeInHours < 10
        ? "0" + maximumRecordingTimeInHours
        : maximumRecordingTimeInHours.toString();
    //if it the elapsed time reach hours and also reach the maximum recording time in hours return true
    if (
      elapsedTimeSplitted.length === 3 &&
      elapsedTimeSplitted[0] === maximumRecordingTimeInHoursAsString
    )
      return true;
    //otherwise, return false
    else return false;
  };

  /** Computes the elapsedTime since the moment the function is called in the format mm:ss or hh:mm:ss
   * @param {String} startTime - start time to compute the elapsed time since
   * @returns {String} elapsed time in mm:ss format or hh:mm:ss format, if elapsed hours are 0.
   */
  const computeElapsedTime = (startTime: Date) => {
    //record end time
    const endTime = new Date();
    //time difference in ms
    let timeDiff = endTime.getTime() - startTime.getTime();
    //convert time difference from ms to seconds
    timeDiff = timeDiff / 1000;
    //extract integer seconds that dont form a minute using %
    let seconds = Math.floor(timeDiff % 60); //ignoring uncomplete seconds (floor)
    //pad seconds with a zero if neccessary
    seconds = seconds < 10 ? 0 + seconds : seconds;
    //convert time difference from seconds to minutes using %
    timeDiff = Math.floor(timeDiff / 60);
    //extract integer minutes that don't form an hour using %
    let minutes = timeDiff % 60; //no need to floor possible incomplete minutes, becase they've been handled as seconds
    minutes = minutes < 10 ? 0 + minutes : minutes;
    //convert time difference from minutes to hours
    timeDiff = Math.floor(timeDiff / 60);
    //extract integer hours that don't form a day using %
    let hours = timeDiff % 24; //no need to floor possible incomplete hours, becase they've been handled as seconds
    //convert time difference from hours to days
    timeDiff = Math.floor(timeDiff / 24);
    // the rest of timeDiff is number of days
    const days = timeDiff; //add days to hours
    let totalHours = hours + days * 24;
    totalHours = totalHours < 10 ? 0 + totalHours : totalHours;
    if (totalHours === 0) {
      return minutes + ":" + seconds;
    } else {
      return totalHours + ":" + minutes + ":" + seconds;
    }
  };

  return (
    <>
      <div className="audio-recording-container">
        <h1 className="title">Audio Recording API Demo</h1>
        {!isRecording && (
          <>
            <FontAwesomeIcon
              onClick={startAudioRecording}
              icon={faMicrophone}
              values="PLay"
              className="start-recording-button"
            />
            <span
              className="start-recording-button"
              onClick={startAudioRecording}
            >
              PLay
            </span>
          </>
        )}
        {isRecording && (
          <div className="recording-contorl-buttons-container ">
            <FontAwesomeIcon
              onClick={cancelAudioRecording}
              icon={faTimesCircle}
              className="cancel-recording-button"
            />
            <div className="recording-elapsed-time">
              <FontAwesomeIcon
                icon={faCircle}
                className="red-recording-dot fas fa-stop-circle"
              />
              <p className="elapsed-time">{elapsedTimeDuringAudioRecording}</p>
            </div>
            <FontAwesomeIcon
              onClick={stopAudioRecording}
              icon={faStopCircle}
              className="stop-recording-button"
            />
            <i
              onClick={stopAudioRecording}
              className="stop-recording-button fa fa-stop-circle-o"
              aria-hidden="true"
            ></i>
          </div>
        )}
        {isPlaying && (
          <div className="text-indication-of-audio-playing-container">
            <p className="text-indication-of-audio-playing">
              Audio is playing<span>.</span>
              <span>.</span>
              <span>.</span>
            </p>

            <p className="text-indication-of-audio-download">
              <a ref={downloadElement} href="">
                <FontAwesomeIcon icon={faDownload} />
              </a>
            </p>
          </div>
        )}
        {displayDownloadLink && (
          <div className="text-indication-of-audio-playing-container">
            <p className="text-indication-of-audio-download">
              <a ref={downloadElement} href="">
                <FontAwesomeIcon icon={faDownload} />
              </a>
            </p>
          </div>
        )}
      </div>
      {displayBrowserNotSupportedOverlay && (
        <div className="overlay hide">
          <div className="browser-not-supporting-audio-recording-box">
            <p>
              To record audio, use browsers like Chrome and Firefox that support
              audio recording.
            </p>
            <button type="button" className="close-browser-not-supported-box">
              Ok.
            </button>
          </div>
        </div>
      )}
      <audio
        ref={audioElement}
        onEnded={audioElementEnded}
        controls
        className="audio-element hide"
      ></audio>
    </>
  );
}

export default App;
