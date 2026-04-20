import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import api from '../services/api';
import { showBrandedAlert } from '../services/brandedAlert';
import styles from '../styles/ForgetPasswordScreen.styles';
import SmartTextInput from '../components/SmartTextInput';

const ForgetPasswordScreen = () => {
  // SECTION: Form state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 360);

  // HANDLER: Request a reset email
  const handleSendEmail = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showBrandedAlert('Missing Email', 'Enter your personal email address first.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/forgot-password', { email: trimmedEmail });
      showBrandedAlert('Email Sent', response.data?.message || 'Check your email for password reset instructions.');
    } catch (error) {
      const serverData = error.response?.data;
      let friendly = 'Failed to connect to the server.';

      if (serverData?.errors) {
        const firstKey = Object.keys(serverData.errors)[0];
        friendly = serverData.errors[firstKey]?.[0] || 'Unable to send the reset email.';
      } else if (serverData?.message) {
        friendly = serverData.message;
      } else if (error.message) {
        friendly = error.message;
      }

      showBrandedAlert('Reset Failed', friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* SECTION: Password reset form */}
      <View style={styles.page}>
        <BrandHeader />

        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.iconWrap}>
            <View style={styles.lockTop} />
            <View style={styles.lockBody}>
              <Text style={styles.questionMark}>?</Text>
            </View>
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>We’ll email you a link to reset your password.</Text>

          <Text style={styles.label}>Enter Your Personal Email</Text>
          <SmartTextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleSendEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Email'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgetPasswordScreen;
