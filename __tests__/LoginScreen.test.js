import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../src/screens/Authentication/LoginScreen'; // Ensure this path is correct
import { AuthContext } from '../src/navigation/AppNavigator';    // Ensure this path is correct
import { loginUser } from '../src/database/firestoreDB';      // Ensure this path is correct
import bcrypt from 'react-native-bcrypt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// --- Mocking Dependencies ---

jest.mock('../src/database/firestoreDB', () => ({
  loginUser: jest.fn(),
}));

jest.mock('react-native-bcrypt', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn((password) => `hashed_${password}`), // Mock hashSync
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// --- Mock AuthContext ---
jest.mock('../src/navigation/AppNavigator', () => {
  const ActualReact = jest.requireActual('react');
  return {
    AuthContext: ActualReact.createContext({
      isLoggedIn: false,
      username: '',
      setIsLoggedIn: jest.fn(),
      setUsername: jest.fn(),
    }),
  };
});

// --- Mock Assets ---
jest.mock('../assets/background.png', () => 0);
jest.mock('../assets/logo.jpg', () => 0);

// --- Test Suite ---
describe('LoginScreen', () => {
  let setIsLoggedInMock;
  let setUsernameMock;
  let navigationMock;

  beforeEach(() => {
    jest.clearAllMocks();
    setIsLoggedInMock = jest.fn();
    setUsernameMock = jest.fn();
    navigationMock = { navigate: jest.fn() };
  });

  const renderComponent = () =>
    render(
      <AuthContext.Provider value={{
        isLoggedIn: false,
        username: '',
        setIsLoggedIn: setIsLoggedInMock,
        setUsername: setUsernameMock
      }}>
        <LoginScreen navigation={navigationMock} />
      </AuthContext.Provider>
    );

  // Test Case 1: Successful Login
  it('updates context and AsyncStorage on successful login', async () => {
    const mockUser = {
      username: 'testuser',
      password: bcrypt.hashSync('testpassword'),
    };
    loginUser.mockResolvedValue(mockUser);
    bcrypt.compareSync.mockReturnValue(true);

    // Use getByRole for buttons
    const { getByPlaceholderText, getByRole } = renderComponent();

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'testpassword');
    fireEvent.press(getByRole('button', { name: 'Login' })); // Find button by role and accessible name

    await waitFor(() => {
      expect(setUsernameMock).toHaveBeenCalledWith('testuser');
      expect(setIsLoggedInMock).toHaveBeenCalledWith(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('isLoggedIn', 'true');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
    });
  });

  // Test Case 2: Failed Login (User not found)
  it('shows alert on failed login if user is not found', async () => {
    loginUser.mockResolvedValue(null);

    const { getByPlaceholderText, getByRole } = renderComponent();
    fireEvent.changeText(getByPlaceholderText('Username'), 'unknownuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'anypassword');
    fireEvent.press(getByRole('button', { name: 'Login' })); // Find button by role and accessible name

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials!');
    });
  });

  // Optional: Test Case 3: Failed Login (Wrong password)
  it('shows alert on failed login if password does not match', async () => {
    const mockUser = {
      username: 'testuser',
      password: bcrypt.hashSync('correctpassword'),
    };
    loginUser.mockResolvedValue(mockUser);
    bcrypt.compareSync.mockReturnValue(false);

    const { getByPlaceholderText, getByRole } = renderComponent();
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByRole('button', { name: 'Login' })); // Find button by role and accessible name

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials!');
    });
  });

  
});
