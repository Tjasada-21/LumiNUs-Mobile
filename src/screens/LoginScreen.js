import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, ImageBackground, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Expo's built-in icons
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      const { token, alumni } = response.data;
      
      await SecureStore.setItemAsync('userToken', token);
      Alert.alert('Success!', `Welcome back, ${alumni.first_name}!`);
      
    navigation.replace('Home'); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to connect to the server.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. The Yellow Building Background
    <ImageBackground 
      source={require('../../assets/images/unnamed.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      
      {/* 2. The Blue Card Container */}
      <View style={styles.cardContainer}>
        
        {/* Logo */}
        <Image 
          source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />

        {/* Email Field */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Your Email Address"
          placeholderTextColor="#A0A0A0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password Field */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Your Password"
            placeholderTextColor="#A0A0A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Remember Me & Forget Password Row */}
        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={styles.rememberContainer} 
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#31429B" />}
            </View>
            <Text style={styles.optionText}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.optionText}>Forget Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#31429B" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5B80B',
  },
  cardContainer: {
    backgroundColor: '#31429B', // Exact NU Blue from design
    width: '88%',
    borderRadius: 20,
    padding: 30,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logo: {
    width: '100%',
    height: 50,
    marginBottom: 35,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#F2C919',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#F2C919',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#F2C919', // Exact NU Gold from design
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 25,
  },
  buttonText: {
    color: '#31429B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default LoginScreen;