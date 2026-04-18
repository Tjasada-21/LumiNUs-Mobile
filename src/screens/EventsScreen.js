import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/EventsScreen.styles';

const EventsScreen = () => {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<Text style={styles.title}>University Events</Text>
				<Text style={styles.subtitle}>Event details will appear here.</Text>
			</View>
		</SafeAreaView>
	);
};

export default EventsScreen;
