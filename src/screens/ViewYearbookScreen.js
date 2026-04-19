import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/ViewYearbookScreen.styles';

const ViewYearbookScreen = () => (
	<SafeAreaView style={styles.safeArea} edges={['top']}>
		<View style={styles.container}>
			<BrandHeader />
			<View style={styles.body} />
		</View>
	</SafeAreaView>
);

export default ViewYearbookScreen;
