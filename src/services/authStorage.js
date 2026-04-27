import * as SecureStore from 'expo-secure-store';

let sessionToken = null;
let sessionEmail = null;
let rememberSession = false;
let tokenLoadPromise = null;

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

  if (tokenLoadPromise) {
    return tokenLoadPromise;
  }

  tokenLoadPromise = SecureStore.getItemAsync('userToken').then((storedToken) => {
    if (storedToken) {
      sessionToken = storedToken;
    }

    return storedToken;
  }).finally(() => {
    tokenLoadPromise = null;
  });

  return tokenLoadPromise;
};

export const peekAuthToken = () => sessionToken;

export const preloadAuthToken = () => {
  if (sessionToken) {
    return Promise.resolve(sessionToken);
  }

  return getAuthToken();
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
  tokenLoadPromise = null;

  await SecureStore.deleteItemAsync('userToken');
  await SecureStore.deleteItemAsync('userEmail');
};
