import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, 
  Alert, ActivityIndicator, ImageBackground, Image 
} from 'react-native';
import SmartTextInput from '../components/SmartTextInput';
import { Ionicons } from '@expo/vector-icons'; // Expo's built-in icons
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import styles from '../styles/LoginScreen.styles';

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
      await SecureStore.setItemAsync('userEmail', alumni?.email || email);
      Alert.alert('Success!', `Welcome back, ${alumni.first_name}!`);
      
    navigation.replace('Home'); 
    } catch (error) {
      console.error('Login error:', error);
      const serverData = error.response?.data;

      // Laravel validation or manual ValidationException will return 422 with
      // either `message` or `errors` object. Prefer specific messages when present.
      let friendly = 'Failed to connect to the server.';

      if (serverData) {
        if (serverData.errors) {
          // errors is an object with arrays, pick the first message available
          const firstKey = Object.keys(serverData.errors)[0];
          friendly = serverData.errors[firstKey]?.[0] || JSON.stringify(serverData.errors);
        } else if (serverData.message) {
          friendly = serverData.message;
        } else {
          friendly = JSON.stringify(serverData);
        }
      } else if (error.message) {
        friendly = error.message;
      }

      Alert.alert('Login Failed', friendly);
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
        <SmartTextInput
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
          <SmartTextInput
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

          <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')}>
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

export default LoginScreen;