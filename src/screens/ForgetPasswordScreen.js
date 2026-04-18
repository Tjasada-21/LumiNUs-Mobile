import React from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/ForgetPasswordScreen.styles';

const ForgetPasswordScreen = () => {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 360);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Send Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgetPasswordScreen;
