import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../src/screens/Authentication/RegisterScreen'; // Adjust path if needed
import { insertUser } from '../src/database/firestoreDB'; // Adjust path if needed
import User from '../src/model/User'; // Adjust path if needed
import bcrypt from 'react-native-bcrypt';
import { Alert } from 'react-native';

// --- Mocking Dependencies ---

// Mock the firestoreDB module
jest.mock('../src/database/firestoreDB', () => ({
  insertUser: jest.fn(),
}));

// Mock react-native-bcrypt
jest.mock('react-native-bcrypt', () => ({
  genSaltSync: jest.fn(() => 'somesalt'),
  hashSync: jest.fn((password, salt) => `hashed_${password}_with_${salt}`),
}));

// Mock React Native's Alert module
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock User model constructor if it has complex logic or side effects (optional for simple classes)
// For this case, we'll let the actual User class be instantiated, but you could mock it if needed:
// jest.mock('../src/model/User');

// --- Mock Assets ---
// Adjust paths according to your project structure.
jest.mock('../assets/background.png', () => 0); // Using 0 for require
jest.mock('../assets/logo.jpg', () => 0);      // Using 0 for require

// --- Test Suite ---
describe('RegisterScreen', () => {
  let navigationMock;

  beforeEach(() => {
    // Clear all mocks before each test to ensure test isolation
    jest.clearAllMocks();
    navigationMock = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true), // Default to canGoBack being true
    };
  });

  // Helper function to render the RegisterScreen
  const renderComponent = () =>
    render(
      <RegisterScreen navigation={navigationMock} />
    );

  // Test Case 1: Successful Registration
  it('registers a user successfully when all fields are valid', async () => {
    insertUser.mockResolvedValue(undefined); // Simulate successful insertion

    const { getByPlaceholderText, getByRole } = renderComponent();

    // Fill out the form
    fireEvent.changeText(getByPlaceholderText('First Name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'User');
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Phone Number'), '1234567890');

    // Press the Register button
    fireEvent.press(getByRole('button', { name: 'Register' }));

    // Assertions
    await waitFor(() => {
      // Check if bcrypt was used
      expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10);
      expect(bcrypt.hashSync).toHaveBeenCalledWith('password123', 'somesalt');

      // Check if insertUser was called with the correct User object
      const expectedHashedPassword = 'hashed_password123_with_somesalt';
      expect(insertUser).toHaveBeenCalledWith(expect.any(User));
      expect(insertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          email: 'test@example.com',
          password: expectedHashedPassword,
          phone: 1234567890,
        })
      );

      // Check for success alert
      expect(Alert.alert).toHaveBeenCalledWith("Success", "User registered successfully!");

      // Check if navigation occurred (goBack because canGoBack is true by default in mock)
      expect(navigationMock.goBack).toHaveBeenCalled();
    });

    // Check if form fields are cleared (optional, but good practice)
    // This requires checking the value prop of the TextInput after state update
    // For simplicity, we'll skip direct value check here, but it's a valid extension.
    // Example: expect(getByPlaceholderText('First Name').props.value).toBe('');
  });

  // Test Case 2: Failed Registration - Empty Fields
  it('shows an alert if any field is empty on registration attempt', async () => {
    const { getByPlaceholderText, getByRole } = renderComponent();

    // Scenario 1: All fields empty
    fireEvent.press(getByRole('button', { name: 'Register' }));
    expect(Alert.alert).toHaveBeenCalledWith("Error", "All fields are required!");
    expect(insertUser).not.toHaveBeenCalled(); // Ensure DB function not called
    Alert.alert.mockClear(); // Clear for next assertion

    // Scenario 2: Some fields filled, one empty (e.g., password)
    fireEvent.changeText(getByPlaceholderText('First Name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'User');
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    // Password left empty
    fireEvent.changeText(getByPlaceholderText('Phone Number'), '1234567890');

    fireEvent.press(getByRole('button', { name: 'Register' }));
    expect(Alert.alert).toHaveBeenCalledWith("Error", "All fields are required!");
    expect(insertUser).not.toHaveBeenCalled();
  });

  // Optional: Test Case 3: Failed Registration - Invalid Email
  it('shows an alert if email is invalid', async () => {
    const { getByPlaceholderText, getByRole } = renderComponent();

    fireEvent.changeText(getByPlaceholderText('First Name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'User');
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'testexample.com'); // Invalid email
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Phone Number'), '1234567890');

    fireEvent.press(getByRole('button', { name: 'Register' }));
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Please enter a valid email address!");
    expect(insertUser).not.toHaveBeenCalled();
  });

  // Optional: Test Case 4: Failed Registration - insertUser throws error
  it('shows an alert if registration fails due to insertUser error', async () => {
    insertUser.mockRejectedValue(new Error('DB error')); // Simulate DB insertion failure

    const { getByPlaceholderText, getByRole } = renderComponent();

    fireEvent.changeText(getByPlaceholderText('First Name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'User');
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Phone Number'), '1234567890');

    fireEvent.press(getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Registration failed. Username may already exist.");
    });
  });

  // Optional: Test Case 5: Loading state
  it('shows loading indicator and disables inputs/buttons during registration', async () => {
    insertUser.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(undefined), 50))); // Simulate delay

    const { getByPlaceholderText, getByRole, queryByText } = renderComponent();

    fireEvent.changeText(getByPlaceholderText('First Name'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'User');
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Phone Number'), '1234567890');

    fireEvent.press(getByRole('button', { name: 'Register' }));

    expect(queryByText('Registering, please wait...')).toBeTruthy();
    expect(getByPlaceholderText('First Name').props.editable).toBe(false);
    // Check one button (React Native Button's disabled state is internal, but inputs are a good proxy)
    // You can also check if the onPress handler is not called again if you try to press while loading,
    // but checking input 'editable' state is simpler here.

    await waitFor(() => expect(queryByText('Registering, please wait...')).toBeNull());
    expect(getByPlaceholderText('First Name').props.editable).toBe(true);
  });

  // Optional: Test Case 6: Navigation to Login screen
  it('navigates to Login screen when "Go to Login" button is pressed', () => {
    const { getByRole } = renderComponent();
    fireEvent.press(getByRole('button', { name: 'Go to Login' }));
    expect(navigationMock.navigate).toHaveBeenCalledWith('Login');
  });

});
