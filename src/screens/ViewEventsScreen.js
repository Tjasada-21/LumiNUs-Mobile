import React from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground, Linking, Image, Modal, Animated, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import BrandHeader from '../components/BrandHeader';
import api from '../services/api';
import { showBrandedAlert } from '../services/brandedAlert';
import styles from '../styles/ViewEventsScreen.styles';

const formatDateRange = (startDate, endDate) => {
	if (!startDate) {
		return 'Date to be announced';
	}

	const start = new Date(startDate);
	const end = endDate ? new Date(endDate) : null;

	if (Number.isNaN(start.getTime())) {
		return 'Date to be announced';
	}

	const startLabel = start.toLocaleDateString(undefined, {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

	if (!end || Number.isNaN(end.getTime()) || end.getTime() === start.getTime()) {
		return startLabel;
	}

	const endLabel = end.toLocaleDateString(undefined, {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

	return `${startLabel} - ${endLabel}`;
};

const ViewEventsScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const event = route?.params?.event ?? null;
	const [registeredEventIds, setRegisteredEventIds] = React.useState([]);
	const [registrationsLoading, setRegistrationsLoading] = React.useState(false);
	const [selectedGalleryImage, setSelectedGalleryImage] = React.useState(null);
	const [selectedGalleryIndex, setSelectedGalleryIndex] = React.useState(0);
	const [galleryScale, setGalleryScale] = React.useState(1);
	const [galleryTranslate, setGalleryTranslate] = React.useState({ x: 0, y: 0 });
	const pinchStartDistanceRef = React.useRef(0);
	const pinchStartScaleRef = React.useRef(1);
	const dragStartRef = React.useRef({ x: 0, y: 0 });
	const galleryViewerScrollRef = React.useRef(null);

	const handleBackPress = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
			return;
		}

		navigation.navigate('Home', { screen: 'EventsScreen' });
	};

	const eventTitle = String(event?.title ?? 'Event Details');
	const eventDescription = String(event?.description ?? '');
	const dateRange = formatDateRange(event?.start_date, event?.end_date);
	const eventType = String(event?.event_type ?? 'Not set');
	const normalizedEventType = eventType.toLowerCase().replace(/[_-]/g, ' ').trim();
	const isOnlineEvent = normalizedEventType === 'online';
	const isInPersonEvent = ['in person', 'inperson', 'physical', 'onsite', 'on site'].includes(normalizedEventType);
	const platform = String(event?.platform ?? 'Not set');
	const platformUrl = String(event?.platform_url ?? '').trim();
	const maxCapacity = event?.max_capacity ?? 'Not set';
	const eventImageUris = Array.isArray(event?.images)
		? event.images.map((image) => image?.image_url).filter(Boolean)
		: [];
	const eventImageUri = eventImageUris[0] ?? event?.cover_image_url ?? null;
	const galleryImageUris = eventImageUris.slice(1, 5);
	const galleryViewportWidth = Dimensions.get('window').width;
	const venueName = String(event?.venue?.name ?? 'Venue not set');
	const venueAddress = String(event?.venue?.address ?? 'Address not available');
	const venueLatitude = Number.parseFloat(event?.venue?.latitude);
	const venueLongitude = Number.parseFloat(event?.venue?.longitude);
	const hasVenueCoordinates = Number.isFinite(venueLatitude) && Number.isFinite(venueLongitude);
	const coordinateLabel = hasVenueCoordinates
		? `Latitude ${venueLatitude.toFixed(6)} • Longitude ${venueLongitude.toFixed(6)}`
		: '';
	const venueMapUri = hasVenueCoordinates
		? `https://www.openstreetmap.org/export/embed.html?bbox=${venueLongitude - 0.002}%2C${venueLatitude - 0.002}%2C${venueLongitude + 0.002}%2C${venueLatitude + 0.002}&layer=mapnik&marker=${venueLatitude}%2C${venueLongitude}`
		: null;
	const isAlreadyRegistered = Boolean(event?.id && registeredEventIds.includes(Number(event.id)));
	const canRegister = !registrationsLoading && !isAlreadyRegistered;
	const canRemoveRegistration = !registrationsLoading && isAlreadyRegistered;

	React.useEffect(() => {
		let isMounted = true;

		const fetchRegistrations = async () => {
			if (!event?.id) {
				return;
			}

			try {
				setRegistrationsLoading(true);
				const response = await api.get('/event-registrations');
				const registrationIds = (response.data?.registrations ?? [])
					.map((registration) => Number(registration?.event_id))
					.filter((registrationId) => Number.isFinite(registrationId));

				if (isMounted) {
					setRegisteredEventIds(registrationIds);
				}
			} catch (error) {
				console.error('Failed to load event registrations:', error);
			} finally {
				if (isMounted) {
					setRegistrationsLoading(false);
				}
			}
		};

		fetchRegistrations();

		return () => {
			isMounted = false;
		};
	}, [event?.id]);

	const refreshRegistrationState = async () => {
		if (!event?.id) {
			return;
		}

		try {
			setRegistrationsLoading(true);
			const response = await api.get('/event-registrations');
			const registrationIds = (response.data?.registrations ?? [])
				.map((registration) => Number(registration?.event_id))
				.filter((registrationId) => Number.isFinite(registrationId));

			setRegisteredEventIds(registrationIds);
		} catch (error) {
			console.error('Failed to refresh event registrations:', error);
		} finally {
			setRegistrationsLoading(false);
		}
	};

	const handlePlatformPress = async () => {
		if (!platformUrl) {
			return;
		}

		try {
			const canOpen = await Linking.canOpenURL(platformUrl);

			if (canOpen) {
				await Linking.openURL(platformUrl);
			}
		} catch (error) {
			console.error('Failed to open platform URL:', error);
		}
	};

	const handleRegisterPress = () => {
		if (!canRegister) {
			return;
		}

		navigation.navigate('EventRegistration', { event });
	};

	const handleRemoveRegistrationPress = () => {
		if (!canRemoveRegistration || !event?.id) {
			return;
		}

		showBrandedAlert(
			'Remove registration?',
			'This will delete your registration for this event.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						try {
							await api.delete(`/events/${event.id}/registrations`);
							await refreshRegistrationState();
							navigation.navigate('Home', { screen: 'EventsScreen' });
						} catch (error) {
							const message = error.response?.data?.message ?? 'Unable to remove your registration right now.';
							showBrandedAlert('Removal failed', message, [{ text: 'OK' }], { variant: 'error' });
						}
					},
				},
			],
			{ variant: 'error' }
		);
	};

	const openGalleryImage = (imageIndex) => {
		if (!galleryImageUris[imageIndex]) {
			return;
		}

		setGalleryScale(1);
		setGalleryTranslate({ x: 0, y: 0 });
		setSelectedGalleryIndex(imageIndex);
		setSelectedGalleryImage(galleryImageUris[imageIndex]);
	};

	const closeGalleryImage = () => {
		setGalleryScale(1);
		setGalleryTranslate({ x: 0, y: 0 });
		setSelectedGalleryIndex(0);
		setSelectedGalleryImage(null);
	};

	const getTouchDistance = (touches) => {
		if (!touches || touches.length < 2) {
			return 0;
		}

		const firstTouch = touches[0];
		const secondTouch = touches[1];
		const deltaX = secondTouch.pageX - firstTouch.pageX;
		const deltaY = secondTouch.pageY - firstTouch.pageY;

		return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	};

	const clampGalleryScale = (value) => Math.max(1, Math.min(4, value));

	const galleryPanResponder = React.useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => false,
				onMoveShouldSetPanResponder: (_, gestureState) => {
					if (gestureState.numberActiveTouches >= 2) {
						return true;
					}

					return galleryScale > 1 && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2);
				},
				onPanResponderGrant: (event) => {
					const touches = event.nativeEvent.touches ?? [];

	React.useEffect(() => {
		if (!selectedGalleryImage) {
			return;
		}

		requestAnimationFrame(() => {
			galleryViewerScrollRef.current?.scrollTo({
				x: selectedGalleryIndex * galleryViewportWidth,
				y: 0,
				animated: false,
			});
		});
	}, [selectedGalleryImage, selectedGalleryIndex, galleryViewportWidth]);

					dragStartRef.current = { ...galleryTranslate };
				},
				onPanResponderMove: (event, gestureState) => {
					const touches = event.nativeEvent.touches ?? [];

					if (touches.length >= 2) {
						if (pinchStartDistanceRef.current === 0) {
							pinchStartDistanceRef.current = getTouchDistance(touches);
							pinchStartScaleRef.current = galleryScale;
							return;
						}

						const currentDistance = getTouchDistance(touches);
						const nextScale = clampGalleryScale(pinchStartScaleRef.current * (currentDistance / pinchStartDistanceRef.current));
						setGalleryScale(nextScale);
						return;
					}

					if (galleryScale > 1) {
						setGalleryTranslate({
							x: dragStartRef.current.x + gestureState.dx,
							y: dragStartRef.current.y + gestureState.dy,
						});
					}
				},
				onPanResponderTerminationRequest: () => false,
				onPanResponderRelease: () => {
					if (galleryScale <= 1.02) {
						setGalleryScale(1);
						setGalleryTranslate({ x: 0, y: 0 });
					}
					pinchStartDistanceRef.current = 0;
					pinchStartScaleRef.current = 1;
				},
				onPanResponderTerminate: () => {
					if (galleryScale <= 1.02) {
						setGalleryScale(1);
						setGalleryTranslate({ x: 0, y: 0 });
					}
					pinchStartDistanceRef.current = 0;
					pinchStartScaleRef.current = 1;
				},
			}),
			[galleryScale, galleryTranslate]
	);

	return (
		<>
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<View style={styles.container}>
					<BrandHeader />
					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
						<View style={styles.headerCard}>
							<Pressable style={styles.backButton} onPress={handleBackPress}>
								<Ionicons name="arrow-back" size={20} color="#31429B" />
								<Text style={styles.backButtonText}>Back</Text>
							</Pressable>

							{eventImageUri ? (
								<ImageBackground source={{ uri: eventImageUri }} style={styles.heroImage} imageStyle={styles.heroImageInner}>
									<View style={styles.heroOverlay} />
								</ImageBackground>
							) : (
								<View style={styles.heroPlaceholder}>
									<Ionicons name="calendar-outline" size={34} color="#31429B" />
								</View>
							)}
						</View>

						<View style={styles.contentCard}>
							<Text style={styles.title}>{eventTitle}</Text>

							{galleryImageUris.length > 0 ? (
								<View style={styles.gallerySection}>
									<Text style={styles.galleryLabel}>Attachments</Text>
									{galleryImageUris.length === 4 ? (
										<View style={styles.galleryGrid}>
											{galleryImageUris.map((imageUri, index) => (
												<Pressable key={`${imageUri}-${index}`} style={styles.galleryGridItem} onPress={() => openGalleryImage(index)}>
													<Image source={{ uri: imageUri }} style={styles.galleryGridImage} resizeMode="cover" />
												</Pressable>
											))}
										</View>
									) : (
										<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
											{galleryImageUris.map((imageUri, index) => (
												<Pressable key={`${imageUri}-${index}`} style={styles.galleryImageWrap} onPress={() => openGalleryImage(index)}>
													<Image source={{ uri: imageUri }} style={styles.galleryImage} resizeMode="cover" />
												</Pressable>
											))}
										</ScrollView>
									)}
								</View>
							) : null}

							<Text style={[styles.galleryLabel, styles.descriptionLabelSpacing]}>Description</Text>

							{eventDescription ? <Text style={styles.description}>{eventDescription}</Text> : null}

							<View style={styles.infoRow}>
								<View style={styles.infoItem}>
									<Text style={styles.infoLabel}>Event Type</Text>
									<Text style={styles.infoValue}>{eventType}</Text>
								</View>

								{isOnlineEvent ? (
									<>
										<View style={styles.infoItem}>
											<Text style={styles.infoLabel}>Platform</Text>
											<Text style={styles.infoValue}>{platform}</Text>
										</View>

										<Pressable
											style={styles.infoItem}
											onPress={handlePlatformPress}
											accessibilityRole="link"
											accessibilityLabel={platformUrl ? `Open platform URL ${platformUrl}` : 'Platform URL unavailable'}
											disabled={!platformUrl}
										>
											<Text style={styles.infoLabel}>Platform URL</Text>
											<Text style={[styles.infoValue, styles.platformLink]} numberOfLines={1}>
												{platformUrl || 'Not set'}
											</Text>
										</Pressable>
									</>
								) : null}

								<View style={styles.infoItem}>
									<Text style={styles.infoLabel}>Start / End Date</Text>
									<Text style={styles.infoValue}>{dateRange}</Text>
								</View>

								<View style={styles.infoItem}>
									<Text style={styles.infoLabel}>Max Capacity</Text>
									<Text style={styles.infoValue}>{maxCapacity}</Text>
								</View>
							</View>

							{isInPersonEvent ? (
								<View style={styles.venueCard}>
									<View style={styles.venueHeaderRow}>
										<View style={styles.venueTitleRow}>
											<Ionicons name="location-outline" size={18} color="#31429B" />
											<Text style={styles.venueLabel}>Venue</Text>
										</View>
										<Text style={styles.venueName}>{venueName}</Text>
									</View>


									{hasVenueCoordinates ? (
										<>
										<View style={styles.mapContainer}>
											<WebView
												source={{ uri: venueMapUri }}
												style={styles.mapWebView}
												originWhitelist={['*']}
												scrollEnabled={false}
												javaScriptEnabled
												domStorageEnabled
											/>
											<View pointerEvents="none" style={styles.mapOverlay}>
												<View style={styles.mapPinWrap}>
													<Ionicons name="location-sharp" size={34} color="#D92D20" />
												</View>
											</View>
										</View>
										</>
									) : (
										<View style={styles.mapFallback}>
											<Ionicons name="map-outline" size={24} color="#64748B" />
											<Text style={styles.mapFallbackText}>Map coordinates are not available for this venue.</Text>
										</View>
									)}

									
								</View>
							) : null}

							<View style={styles.registerButtonContainer}>
								<Pressable
									style={[
										styles.registerButton,
										isAlreadyRegistered ? styles.registerButtonDestructive : null,
										!isAlreadyRegistered && !canRegister ? styles.registerButtonDisabled : null,
									]}
									onPress={isAlreadyRegistered ? handleRemoveRegistrationPress : handleRegisterPress}
									accessibilityRole="button"
									disabled={registrationsLoading || (!isAlreadyRegistered && !canRegister)}
									accessibilityState={{ disabled: registrationsLoading || (!isAlreadyRegistered && !canRegister) }}
								>
									<Text style={styles.registerButtonText}>
										{isAlreadyRegistered ? 'Remove Registration' : registrationsLoading ? 'Checking...' : 'Register'}
									</Text>
								</Pressable>
							</View>
						</View>
						
					</ScrollView>
				</View>
			</SafeAreaView>

			<Modal visible={Boolean(selectedGalleryImage)} transparent animationType="fade" onRequestClose={closeGalleryImage}>
				<View style={styles.galleryModalBackdrop}>
					<View style={styles.galleryModalContent}>
						<Pressable style={styles.galleryModalCloseButton} onPress={closeGalleryImage}>
							<Ionicons name="close" size={22} color="#FFFFFF" />
						</Pressable>
						<ScrollView
							ref={galleryViewerScrollRef}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							style={styles.galleryModalScroll}
							contentContainerStyle={styles.galleryModalScrollContent}
							onMomentumScrollEnd={(event) => {
								const nextIndex = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
								setSelectedGalleryIndex(nextIndex);
								setSelectedGalleryImage(galleryImageUris[nextIndex] ?? null);
								setGalleryScale(1);
								setGalleryTranslate({ x: 0, y: 0 });
							}}
						>
							{galleryImageUris.map((imageUri, index) => (
								<View key={`${imageUri}-${index}`} style={[styles.galleryModalStage, { width: galleryViewportWidth }]} {...galleryPanResponder.panHandlers}>
									<Animated.Image
										source={{ uri: imageUri }}
										style={[
											styles.galleryModalImage,
											{
												transform: [
													{ translateX: galleryTranslate.x },
													{ translateY: galleryTranslate.y },
													{ scale: galleryScale },
												],
											},
										]}
										resizeMode="contain"
									/>
								</View>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</>
	);
};

export default ViewEventsScreen;
