import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/ViewYearbookScreen.styles';

const ViewYearbookScreen = () => {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<Text style={styles.title}>Digital Yearbook</Text>
				<Text style={styles.subtitle}>Yearbook content will appear here.</Text>
			</View>
		</SafeAreaView>
	);
};

export default ViewYearbookScreen;
