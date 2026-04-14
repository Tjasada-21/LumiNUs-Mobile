import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // 1. Send data to Laravel
      const response = await api.post('/login', {
        email: email,
        password: password,
      });

      // 2. Extract the token and user data from Laravel's response
      const { token, alumni } = response.data;

      // 3. Securely save the token to the phone
      await SecureStore.setItemAsync('userToken', token);
      
      Alert.alert('Success!', `Welcome back, ${alumni.first_name}!`);
      
      // 4. Navigate to the Home Screen (we will build this next)
      // navigation.replace('Home'); 

    } catch (error) {
      console.error('Login Error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to connect to the server. Check your network.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LumiNUs</Text>
      <Text style={styles.subtitle}>Alumni Portal</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => console.log('Navigate to Register')}>
        <Text style={styles.linkText}>Don't have an account? Register here.</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#00205B', textAlign: 'center' }, // NU Blue
  subtitle: { fontSize: 18, color: '#FFB81C', textAlign: 'center', marginBottom: 40 }, // NU Gold
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#00205B', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#00205B', textAlign: 'center', marginTop: 20, textDecorationLine: 'underline' }
});

export default LoginScreen;