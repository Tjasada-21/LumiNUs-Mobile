import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/AlumniTracerScreen.styles';

const AlumniTracerScreen = () => {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<Text style={styles.title}>Alumni Tracer</Text>
				<Text style={styles.subtitle}>Tracer details will appear here.</Text>
			</View>
		</SafeAreaView>
	);
};

export default AlumniTracerScreen;
