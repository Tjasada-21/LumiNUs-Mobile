import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/EventRegistrationScreen.styles';

const EventRegistrationScreen = () => {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			{/* SECTION: Empty state */}
			<View style={styles.container}>
				<Text style={styles.title}>Event Registration</Text>
				<Text style={styles.subtitle}>Registration details will appear here.</Text>
			</View>
		</SafeAreaView>
	);
};

export default EventRegistrationScreen;
