import { StyleSheet } from 'react-native';

export const colors = {
	blue: '#31429B',
	lightBlue: '#F7F9FC',
	textPrimary: '#31429B',
	textSecondary: '#4B5563',
};

export const sharedScreenStyles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.lightBlue,
	},
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: colors.textPrimary,
		textAlign: 'center',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: colors.textSecondary,
		textAlign: 'center',
	},
});
