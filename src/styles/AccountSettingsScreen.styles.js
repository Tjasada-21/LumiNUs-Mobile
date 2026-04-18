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
  header: {
    backgroundColor: '#31429B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    width: 146,
    height: 36,
  },
  badgeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 17,
    height: 17,
    marginRight: 6,
  },
  badgeText: {
    color: '#2D3F9E',
    fontWeight: '800',
    fontSize: 12,
  },
  headerAccent: {
    height: 11,
    backgroundColor: '#F2C919',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  homeButton: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2C919',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  profileWrap: {
    alignSelf: 'center',
    marginTop: '1%',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: '#EEE',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2C919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#E4E4E4',
    borderRadius: 16,
  },
  sectionHeading: {
    color: '#3F3F3F',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHeadingSpacing: {
    marginTop: 6,
  },
  inputBlock: {
    backgroundColor: '#EFEFEF',
    borderWidth: 1,
    borderColor: '#B9B9B9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  inputBlockCompact: {
    backgroundColor: '#EFEFEF',
    borderWidth: 1,
    borderColor: '#B9B9B9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 1,
    marginBottom: 8,
  },
  inputLabel: {
    color: '#5C5C5C',
    fontSize: 10,
    marginBottom: 1,
  },
  inputValue: {
    color: '#333333',
    fontSize: 14,
  },
  inputGrow: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputEmailValue: {
    flex: 1,
  },
  genderSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  verifyLinkButton: {
    marginLeft: 8,
    flexShrink: 0,
  },
  verifiedText: {
    color: '#2F9B3D',
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  verifyLink: {
    color: '#31429B',
    fontSize: 10,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  helpText: {
    color: '#777777',
    fontSize: 8,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoColRowStacked: {
    flexDirection: 'column',
  },
  halfInput: {
    width: '48.5%',
    marginBottom: 0,
  },
  fullWidthInput: {
    width: '100%',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    paddingVertical: 0,
  },
  genderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    paddingVertical: 0,
  },
  dateValue: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
    paddingVertical: 0,
  },
  loadingWrap: {
    paddingTop: 16,
  },
  loadingText: {
    color: '#31429B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#F2C919',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 22,
  },
  saveButtonText: {
    color: '#31429B',
    fontSize: 12,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#31429B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 14,
  },
  resetButtonText: {
    color: '#F2C919',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default styles;
