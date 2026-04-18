import * as SecureStore from 'expo-secure-store';

let sessionToken = null;
let sessionEmail = null;
let rememberSession = false;

export const setAuthCredentials = async ({ token, email, remember }) => {
  sessionToken = token ?? null;
  sessionEmail = email ?? null;
  rememberSession = Boolean(remember);

  if (rememberSession) {
    if (sessionToken) {
      await SecureStore.setItemAsync('userToken', sessionToken);
    } else {
      await SecureStore.deleteItemAsync('userToken');
    }

    if (sessionEmail) {
      await SecureStore.setItemAsync('userEmail', sessionEmail);
    } else {
      await SecureStore.deleteItemAsync('userEmail');
    }
  } else {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userEmail');
  }
};

export const getAuthToken = async () => {
  if (sessionToken) {
    return sessionToken;
  }

  const storedToken = await SecureStore.getItemAsync('userToken');
  if (storedToken) {
    sessionToken = storedToken;
  }

  return storedToken;
};

export const getAuthEmail = async () => {
  if (sessionEmail) {
    return sessionEmail;
  }

  const storedEmail = await SecureStore.getItemAsync('userEmail');
  if (storedEmail) {
    sessionEmail = storedEmail;
  }

  return storedEmail;
};

export const isRememberedSession = () => rememberSession;

export const clearAuthCredentials = async () => {
  sessionToken = null;
  sessionEmail = null;
  rememberSession = false;

  await SecureStore.deleteItemAsync('userToken');
  await SecureStore.deleteItemAsync('userEmail');
};
