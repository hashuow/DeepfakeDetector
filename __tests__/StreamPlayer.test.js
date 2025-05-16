import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import StreamPlayer from '../src/screens/Home/StreamPlayer'; // Adjust path as needed
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { insertAudioFile } from '../src/database/firestoreDB'; // Adjust path as needed
import { Alert, StatusBar } from 'react-native';

// --- Configure Jest Timers ---
jest.useFakeTimers(); // Enable Jest's fake timers

// --- Mocking Dependencies ---

const mockInstancePlay = jest.fn((cb) => { if (cb) cb(true); });
const mockInstanceStop = jest.fn();
const mockInstanceRelease = jest.fn();
const mockInstanceSetNumberOfLoops = jest.fn();

jest.mock('react-native-sound', () => {
  const MockSoundConstructor = jest.fn().mockImplementation((soundName, bundle, callback) => {
    // This is the object that will be returned by `new Sound()`
    const soundInstance = {
      play: mockInstancePlay,
      stop: mockInstanceStop,
      release: mockInstanceRelease,
      setNumberOfLoops: mockInstanceSetNumberOfLoops,
      _soundName: soundName, // For debugging or more complex mocks
    };
    if (callback) {
      setTimeout(() => {
        callback(null); // Simulate successful load after a tick
      }, 0);
    }
    return soundInstance; // This instance is assigned to ringtoneRef.current
  });

  MockSoundConstructor.setCategory = jest.fn();
  MockSoundConstructor.MAIN_BUNDLE = 'mock_main_bundle';
  return MockSoundConstructor;
});

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/document/directory',
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 }),
  })),
}));

jest.mock('axios');
jest.mock('../src/database/firestoreDB', () => ({
  insertAudioFile: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => 'StatusBar');

// Explicitly mock react-native-video
jest.mock('react-native-video', () => 'Video');


// --- Test Suite ---
describe('StreamPlayer', () => {
  const mockOnEnd = jest.fn();
  const defaultProps = {
    recordingUrl: 'http://example.com/test.mp3',
    from: 'Test Caller',
    to: 'CurrentUser',
    onEnd: mockOnEnd,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstancePlay.mockClear().mockImplementation((cb) => { if (cb) cb(true); });
    mockInstanceStop.mockClear();
    mockInstanceRelease.mockClear();
    mockInstanceSetNumberOfLoops.mockClear();
  });

  // Test 1: Initial render and ringtone
  it('renders incoming call UI and plays ringtone on mount', async () => {
    const { getByText } = render(<StreamPlayer {...defaultProps} />);
    expect(Sound).toHaveBeenCalledWith('ringtone', Sound.MAIN_BUNDLE, expect.any(Function));
    
    act(() => { jest.runAllTimers(); }); // Execute the setTimeout in the Sound mock's callback

    // Access the *returned instance* from the mock constructor
    const soundInstance = Sound.mock.results[0].value;
    expect(soundInstance).toBeDefined();

    await waitFor(() => {
      expect(soundInstance.setNumberOfLoops).toHaveBeenCalledWith(-1);
      expect(soundInstance.play).toHaveBeenCalledTimes(1);
    });

    expect(getByText('📞 Incoming Call')).toBeTruthy();
    expect(getByText(defaultProps.from)).toBeTruthy();
    expect(getByText('Decline')).toBeTruthy();
    expect(getByText('Accept')).toBeTruthy();
  });

  // Test 2: Rejecting a call
  it('stops ringtone and calls onEnd when "Decline" is pressed', () => {
    const { getByText } = render(<StreamPlayer {...defaultProps} />);
    act(() => { jest.runAllTimers(); }); // Allow initial useEffect (and Sound callback) to complete
    
    fireEvent.press(getByText('Decline'));

    const ringtoneInstance = Sound.mock.results[0].value; // Get returned instance
    expect(ringtoneInstance.stop).toHaveBeenCalledTimes(1);
    expect(ringtoneInstance.release).toHaveBeenCalledTimes(1);
    expect(mockOnEnd).toHaveBeenCalledTimes(1);
  });

  // Test 3: Accepting a non-Twilio call (simulated as fake)
  it('accepts call, downloads audio, simulates fake prediction, and triggers alarm/alert/hangup', async () => {
    const { getByText, queryByText } = render(
      <StreamPlayer {...defaultProps} recordingUrl="http://example.com/fake_call.mp3" />
    );
    act(() => { jest.runAllTimers(); }); // Initial ringtone setup

    // Press Accept
    // No need to wrap fireEvent.press in act if it only triggers sync state updates before async ops
    fireEvent.press(getByText('Accept'));

    // Wait for UI to update to "In Call" state (due to setCallAccepted(true))
    await waitFor(() => {
      expect(getByText('🔊 In Call')).toBeTruthy();
    });
    // After "In Call" is visible, check other elements
    expect(getByText('Hang Up')).toBeTruthy();
    expect(queryByText('📞 Incoming Call')).toBeNull();


    const ringtoneInstance = Sound.mock.results[0].value;
    expect(ringtoneInstance.stop).toHaveBeenCalledTimes(1);

    // Check download
    await waitFor(() => {
      expect(RNFS.downloadFile).toHaveBeenCalledWith({
        fromUrl: "http://example.com/fake_call.mp3",
        toFile: expect.stringContaining('/mock/document/directory/call_'),
      });
    });

    // Check insertAudioFile
    await waitFor(() => {
      expect(insertAudioFile).toHaveBeenCalledWith(
        expect.objectContaining({
          from: defaultProps.from,
          to: defaultProps.to,
          recordingUrl: "http://example.com/fake_call.mp3",
          prediction: 'fake',
        }),
        defaultProps.to
      );
    });

    // Fast-forward timers for the 5-second alarm timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // Allow alarm sound loading (if any setTimeout is involved in its play)
    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(Sound).toHaveBeenCalledWith('alarm', Sound.MAIN_BUNDLE, expect.any(Function));
      // The second call to Sound constructor (for alarm) will also use the global mockInstancePlay
      expect(mockInstancePlay).toHaveBeenCalledTimes(2); // Once for ringtone, once for alarm
      expect(Alert.alert).toHaveBeenCalledWith('🚨 Fake Call Detected', 'This appears to be a spoofed voice.');
      expect(mockOnEnd).toHaveBeenCalledTimes(1); // Called by handleReject
    });
  });

  // Test 4: Accepting a Twilio call (trusted)
  it('accepts Twilio call, predicts as real, and does NOT trigger alarm', async () => {
    const twilioUrl = 'https://api.twilio.com/some_recording.mp3';
    const { getByText } = render(
      <StreamPlayer {...defaultProps} recordingUrl={twilioUrl} />
    );
    act(() => { jest.runAllTimers(); }); // Initial ringtone

    fireEvent.press(getByText('Accept'));
    
    await waitFor(() => expect(getByText('🔊 In Call')).toBeTruthy());


    await waitFor(() => {
      expect(RNFS.downloadFile).toHaveBeenCalledWith({
        fromUrl: twilioUrl,
        toFile: expect.stringContaining('/mock/document/directory/call_'),
      });
    });

    await waitFor(() => {
      expect(insertAudioFile).toHaveBeenCalledWith(
        expect.objectContaining({
          recordingUrl: twilioUrl,
          prediction: 'real',
          to: "hash",
        }),
        "hash"
      );
    });

    act(() => { jest.advanceTimersByTime(5000); });
    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(Sound).toHaveBeenCalledTimes(1); // Only ringtone
      expect(Alert.alert).not.toHaveBeenCalledWith('🚨 Fake Call Detected', expect.anything());
    });
    expect(mockOnEnd).not.toHaveBeenCalled();
  });

  // Test 5: Video onEnd callback
  it('calls onEnd when accepted call audio finishes (Video onEnd)', async () => {
    const { getByText, UNSAFE_getByType } = render(<StreamPlayer {...defaultProps} />);
    act(() => { jest.runAllTimers(); }); // Initial ringtone

    fireEvent.press(getByText('Accept'));
    
    let videoPlayer;
    await waitFor(() => {
      expect(getByText('🔊 In Call')).toBeTruthy();
      videoPlayer = UNSAFE_getByType('Video'); 
      expect(videoPlayer).toBeTruthy();
    });

    act(() => {
        if (videoPlayer && videoPlayer.props.onEnd) {
            videoPlayer.props.onEnd();
        }
    });

    expect(mockOnEnd).toHaveBeenCalledTimes(1);
  });

  // Test 6: Cleanup on unmount
  it('stops ringtone on unmount', () => {
    const { unmount } = render(<StreamPlayer {...defaultProps} />);
    act(() => { jest.runAllTimers(); });
    unmount();

    const ringtoneInstance = Sound.mock.results[0].value;
    expect(ringtoneInstance.stop).toHaveBeenCalledTimes(1);
    expect(ringtoneInstance.release).toHaveBeenCalledTimes(1);
  });
});
