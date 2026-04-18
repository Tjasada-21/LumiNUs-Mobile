import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#31429B',
	},
	container: {
		flex: 1,
		backgroundColor: '#ECECEC',
	},
	brandHeader: {
		backgroundColor: '#31429B',
	},
	brandRow: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 18,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	brandLogo: {
		width: 136,
		height: 42,
	},
	nulipaPill: {
		backgroundColor: '#FFFFFF',
		borderRadius: 999,
		paddingVertical: 7,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	nulipaIcon: {
		width: 22,
		height: 22,
		marginRight: 6,
	},
	nulipaText: {
		color: '#2D3F9E',
		fontWeight: '800',
		fontSize: 14,
		letterSpacing: 0.3,
	},
	brandAccent: {
		height: 10,
		backgroundColor: '#F2C919',
	},
	contentWrap: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	userRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	userInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		marginRight: 10,
	},
	userTextWrap: {
		flexShrink: 1,
	},
	avatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		marginRight: 10,
	},
	helloText: {
		color: '#6A6A6A',
		fontSize: 14,
		lineHeight: 16,
	},
	nameText: {
		color: '#3E3E3E',
		fontSize: 20,
		fontWeight: '800',
	},
	actionsRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	circleAction: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: '#31429B',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F2F3F8',
		marginLeft: 8,
	},
	composeAction: {
		backgroundColor: '#31429B',
	},
	segmentedWrap: {
		flexDirection: 'row',
		backgroundColor: '#DADBE0',
		borderRadius: 16,
		padding: 2,
		marginBottom: 6,
	},
	segmentItem: {
		flex: 1,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 6,
	},
	segmentItemActive: {
		backgroundColor: '#31429B',
	},
	segmentText: {
		color: '#8C8D94',
		fontSize: 14,
		fontWeight: '500',
	},
	segmentTextActive: {
		color: '#FFFFFF',
		fontWeight: '700',
	},
	listArea: {
		flex: 1,
	},
	listContent: {
		minHeight: '100%',
		paddingTop: 12,
		paddingBottom: 20,
	},
});

export default styles;