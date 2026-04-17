import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#31429B',
  },
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  brandHeader: {
    backgroundColor: '#31429B',
  },
  brandRow: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogo: {
    width: 136,
    height: 42,
  },
  nulipaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 122,
    justifyContent: 'center',
  },
  nulipaIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  nulipaText: {
    color: '#31429B',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  brandAccent: {
    height: 10,
    backgroundColor: '#F2C919',
  },
  content: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 72,
  },
  iconWrap: {
    width: 86,
    height: 106,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  lockTop: {
    width: 38,
    height: 26,
    borderWidth: 6,
    borderColor: '#31429B',
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: -2,
  },
  lockBody: {
    width: 86,
    height: 72,
    borderWidth: 6,
    borderColor: '#31429B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMark: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
    color: '#31429B',
    marginTop: -2,
  },
  title: {
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '800',
    color: '#31429B',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    width: '100%',
    fontSize: 14,
    lineHeight: 18,
    color: '#4B5563',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#B8B8B8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 28,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#31429B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#F2C919',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default ForgetPasswordScreen;
