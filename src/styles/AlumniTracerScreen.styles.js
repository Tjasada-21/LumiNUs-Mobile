import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#31429B',
	},
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'flex-start',
		paddingHorizontal: 0,
		backgroundColor: '#FFFFFF',
	},
	contentWrap: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
		backgroundColor: '#FFFFFF',
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#31429B',
		textAlign: 'center',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#4B5563',
		textAlign: 'center',
	},
	listContainer: {
		flex: 1,
		width: '100%',
		paddingHorizontal: 12,
		paddingTop: 12,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 12,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOpacity: 0.03,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
		elevation: 1,
	},
	tracerAvatar: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: '#E6EEF9',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	tracerInitials: {
		color: '#24407F',
		fontWeight: '800',
		fontSize: 16,
	},
	tracerInfo: {
		flex: 1,
	},
	tracerName: {
		fontSize: 15,
		fontWeight: '800',
		color: '#24346F',
	},
	tracerMeta: {
		fontSize: 13,
		color: '#6B7280',
		marginTop: 2,
	},

	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 32,
	},
	emptyText: {
		color: '#6B7280',
		fontSize: 15,
		marginBottom: 12,
	},
	refreshButton: {
		backgroundColor: '#31429B',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
	},
	refreshButtonText: {
		color: '#FFFFFF',
		fontWeight: '700',
	},

	modalContent: {
		flex: 1,
		padding: 16,
		backgroundColor: '#FFFFFF',
		justifyContent: 'flex-start',
	},
	modalHeader: {
		fontSize: 20,
		fontWeight: '800',
		color: '#31429B',
		marginBottom: 12,
	},
	modalScroll: {
		flex: 1,
		marginBottom: 12,
	},
	modalField: {
		marginBottom: 10,
	},
	modalFieldKey: {
		fontSize: 12,
		color: '#6B7280',
		textTransform: 'capitalize',
	},
	modalFieldValue: {
		fontSize: 15,
		color: '#24346F',
		marginTop: 2,
	},
	modalDescription: {
		fontSize: 14,
		color: '#374151',
		marginBottom: 12,
	},
	modalCloseButton: {
		alignSelf: 'stretch',
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 8,
		backgroundColor: '#31429B',
	},
	modalCloseText: {
		color: '#FFFFFF',
		fontWeight: '700',
	},
});

export default styles;
