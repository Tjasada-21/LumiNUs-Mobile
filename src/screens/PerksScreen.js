import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/PerksScreen.styles';

const PerksScreen = () => {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<Text style={styles.title}>Perks and Discounts</Text>
				<Text style={styles.subtitle}>Perks content will appear here.</Text>
			</View>
		</SafeAreaView>
	);
};

export default PerksScreen;
