import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTION_DATA = [
	{
		title: 'Alumni Files',
		items: [
			{
				label: 'Digital\nYearbook',
				icon: require('../../assets/images/digital-yearbook-icon-in-blue.png'),
			},
			{
				label: 'NU Alumni ID',
				icon: require('../../assets/images/frame-12.png'),
			},
			{
				label: 'Alumni\nTracer',
				icon: require('../../assets/images/trace-icon-in-blue.png'),
			},
		],
	},
	{
		title: 'Campus Engagement',
		items: [
			{
				label: 'Registration',
				icon: require('../../assets/images/registration-icon-in-blue-1.png'),
			},
			{
				label: 'University Events',
				icon: require('../../assets/images/view-uni-events-icon-in-blue-1.png'),
			},
			{
				label: 'Messages',
				icon: require('../../assets/images/messages-id-icon-in-blue-1.png'),
			},
		],
	},
	{
		title: 'Other',
		items: [
			{
				label: 'My Feed',
				icon: require('../../assets/images/feed-icon-in-blue-1.png'),
			},
			{
				label: 'Perks and\nDiscounts',
				icon: require('../../assets/images/view-perks-icon-in-blue-1.png'),
			},
			{
				label: 'NU Website',
				icon: require('../../assets/images/nu-lipa-logo-portrait-white-version-21.png'),
			},
		],
	},
];

const ExploreScreen = () => {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<View style={styles.gradientOverlayTop} />
				<View style={styles.gradientOverlayBottom} />

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<Image
						source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')}
						style={styles.logo}
						resizeMode="contain"
					/>

					{SECTION_DATA.map((section) => (
						<View key={section.title} style={styles.sectionCard}>
							<Text style={styles.sectionTitle}>{section.title}</Text>

							<View style={styles.itemRow}>
								{section.items.map((item) => (
									<TouchableOpacity key={`${section.title}-${item.label}`} style={styles.itemBtn} activeOpacity={0.85}>
										<View style={styles.iconWrap}>
											<Image source={item.icon} style={styles.icon} resizeMode="contain" />
										</View>
										<Text style={styles.itemLabel}>{item.label}</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					))}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#2E3F98',
	},
	container: {
		flex: 1,
		backgroundColor: '#2E3F98',
	},
	gradientOverlayTop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: '42%',
		backgroundColor: '#3A4AA2',
		opacity: 0.35,
	},
	gradientOverlayBottom: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: '38%',
		backgroundColor: '#1E2B73',
		opacity: 0.45,
	},
	scrollContent: {
		paddingHorizontal: 14,
		paddingTop: 18,
		paddingBottom: 24,
	},
	logo: {
		width: 188,
		height: 56,
		alignSelf: 'center',
		marginBottom: 16,
	},
	sectionCard: {
		backgroundColor: '#2C3B89',
		borderRadius: 20,
		paddingTop: 10,
		paddingBottom: 14,
		paddingHorizontal: 12,
		marginBottom: 12,
	},
	sectionTitle: {
		color: '#FFFFFF',
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 10,
	},
	itemRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	itemBtn: {
		width: '31%',
		alignItems: 'center',
	},
	iconWrap: {
		width: 83,
		height: 83,
		borderRadius: 21,
		backgroundColor: '#3248A2',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#0D133D',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 5,
		elevation: 4,
		marginBottom: 8,
	},
	icon: {
		width: 54,
		height: 54,
	},
	itemLabel: {
		color: '#FFFFFF',
		fontSize: 13,
		lineHeight: 16,
		textAlign: 'center',
		fontWeight: '400',
		minHeight: 38,
	},
});

export default ExploreScreen;
