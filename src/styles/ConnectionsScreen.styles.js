import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#31429B',
	},
	container: {
		flex: 1,
		backgroundColor: '#F5F7FB',
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
		paddingBottom: 24,
	},
	headerCard: {
		marginTop: 14,
		marginBottom: 14,
		backgroundColor: '#FFFFFF',
		borderRadius: 22,
		padding: 16,
		elevation: 3,
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
	},
	title: {
		color: '#31429B',
		fontSize: 24,
		lineHeight: 28,
		fontWeight: '900',
	},
	subtitle: {
		marginTop: 6,
		color: '#6B7280',
		fontSize: 13,
		lineHeight: 18,
	},
	loadingWrap: {
		paddingVertical: 24,
		alignItems: 'center',
	},
	emptyCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 18,
		padding: 18,
		alignItems: 'center',
	},
	emptyTitle: {
		color: '#31429B',
		fontSize: 16,
		fontWeight: '800',
	},
	emptyText: {
		marginTop: 6,
		color: '#6B7280',
		fontSize: 13,
		lineHeight: 18,
		textAlign: 'center',
	},
	contactList: {
		paddingBottom: 8,
	},
	contactCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 18,
		padding: 12,
		marginBottom: 12,
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 3 },
	},
	contactAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 12,
		backgroundColor: '#E5E7EB',
	},
	contactTextWrap: {
		flex: 1,
	},
	contactName: {
		color: '#31429B',
		fontSize: 15,
		fontWeight: '800',
	},
	contactMeta: {
		marginTop: 2,
		color: '#6B7280',
		fontSize: 12,
	},
});

export default styles;