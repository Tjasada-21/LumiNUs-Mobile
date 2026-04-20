import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Pressable, Animated, PanResponder, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/EventsScreen.styles';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FEATURED_PLACEHOLDER_ITEMS = [
	{ id: 1, searchTerms: ['campus', 'featured', 'spotlight'] },
	{ id: 2, searchTerms: ['career', 'featured', 'spotlight'] },
	{ id: 3, searchTerms: ['sports', 'featured', 'spotlight'] },
	{ id: 4, searchTerms: ['community', 'featured', 'spotlight'] },
	{ id: 5, searchTerms: ['student', 'featured', 'spotlight'] },
];
const COMING_SOON_PLACEHOLDER_ITEMS = [
	{ id: 1, searchTerms: ['career', 'coming soon', 'registration'] },
	{ id: 2, searchTerms: ['leadership', 'coming soon', 'registration'] },
	{ id: 3, searchTerms: ['workshop', 'coming soon', 'registration'] },
	{ id: 4, searchTerms: ['seminar', 'coming soon', 'registration'] },
	{ id: 5, searchTerms: ['sports', 'coming soon', 'registration'] },
	{ id: 6, searchTerms: ['community', 'coming soon', 'registration'] },
];
const PRE_REGISTERED_EVENTS = [];

const getMonthDays = (year, monthIndex) => {
	const firstDay = new Date(year, monthIndex, 1);
	const lastDay = new Date(year, monthIndex + 1, 0);
	const leadingEmptyCells = firstDay.getDay();
	const daysInMonth = lastDay.getDate();
	const cells = [];

	for (let index = 0; index < leadingEmptyCells; index += 1) {
		cells.push(null);
	}

	for (let day = 1; day <= daysInMonth; day += 1) {
		cells.push(day);
	}

	while (cells.length % 7 !== 0) {
		cells.push(null);
	}

	return cells;
};

const EventsScreen = () => {
	// SECTION: Screen state
	const [calendarVisible, setCalendarVisible] = React.useState(false);
	const [registrationsVisible, setRegistrationsVisible] = React.useState(false);
	const [currentDate, setCurrentDate] = React.useState(new Date());
	const [searchQuery, setSearchQuery] = React.useState('');
	const slideAnimation = React.useRef(new Animated.Value(0)).current;
	const { width: screenWidth } = useWindowDimensions();
	const calendarWidth = Math.min(screenWidth - 40, 360);
	const slideDistance = calendarWidth - 36;

	// DERIVED VALUES: Calendar and search filtering
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();
	const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
	const monthDays = getMonthDays(currentYear, currentMonth);
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const isSearching = normalizedQuery.length > 0;
	const matchesSearch = (terms) => {
		if (!normalizedQuery) {
			return true;
		}

		return terms.some((term) => term.toLowerCase().includes(normalizedQuery));
	};
	const visibleFeaturedItems = FEATURED_PLACEHOLDER_ITEMS.filter((item) => matchesSearch(item.searchTerms));
	const visibleComingSoonItems = COMING_SOON_PLACEHOLDER_ITEMS.filter((item) => matchesSearch(item.searchTerms));
	const hasPreRegisteredEvents = PRE_REGISTERED_EVENTS.length > 0;

	// HANDLER: Open the calendar modal
	const openCalendar = () => {
		setCalendarVisible(true);
	};

	// HANDLER: Open the registrations modal
	const openRegistrations = () => {
		setRegistrationsVisible(true);
	};

	// HANDLER: Close the calendar modal
	const closeCalendar = () => {
		setCalendarVisible(false);
	};

	// HANDLER: Close the registrations modal
	const closeRegistrations = () => {
		setRegistrationsVisible(false);
	};

	// HANDLER: Animate month transitions
	const animateMonthChange = (direction) => {
		const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
		const exitOffset = direction > 0 ? -slideDistance : slideDistance;
		const entryOffset = direction > 0 ? slideDistance : -slideDistance;

		Animated.timing(slideAnimation, {
			toValue: exitOffset,
			duration: 220,
			useNativeDriver: true,
		}).start(() => {
			setCurrentDate(nextDate);
			slideAnimation.setValue(entryOffset);
			requestAnimationFrame(() => {
				Animated.timing(slideAnimation, {
					toValue: 0,
					duration: 220,
					useNativeDriver: true,
				}).start();
			});
		});
	};

	// HANDLER: Go to the previous month
	const goToPreviousMonth = () => {
		animateMonthChange(-1);
	};

	// HANDLER: Go to the next month
	const goToNextMonth = () => {
		animateMonthChange(1);
	};

	// SECTION: Swipe gesture support
	const calendarPanResponder = React.useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 8,
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dx < -40) {
					animateMonthChange(1);
					return;
				}

				if (gestureState.dx > 40) {
					animateMonthChange(-1);
					return;
				}

				Animated.spring(slideAnimation, {
					toValue: 0,
					useNativeDriver: true,
					bounciness: 0,
				}).start();
			},
		})
	).current;

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				{/* SECTION: Search and actions */}
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
					<View style={styles.searchRow}>
						<View style={styles.searchFieldWrap}>
							<Ionicons name="search" size={22} color="#7A7A7A" style={styles.searchIcon} />
							<TextInput
								value={searchQuery}
								onChangeText={setSearchQuery}
								placeholder="Search for University Events"
								placeholderTextColor="#7A7A7A"
								style={styles.searchInput}
								autoCorrect={false}
								autoCapitalize="none"
							/>
						</View>

						<TouchableOpacity style={styles.squareButton} activeOpacity={0.85} onPress={openCalendar}>
							<Ionicons name="calendar" size={20} color="#FFFFFF" />
						</TouchableOpacity>

						<TouchableOpacity style={[styles.squareButton, styles.accentButton]} activeOpacity={0.85} onPress={openRegistrations}>
							<Ionicons name="document-text-outline" size={20} color="#31429B" />
						</TouchableOpacity>
					</View>

					<Text style={styles.sectionTitle}>Events For You!</Text>

					{/* SECTION: Featured events */}
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsRow}>
						{visibleFeaturedItems.map((item) => (
										<View key={`featured-placeholder-${item.id}`} style={styles.featuredCardPlaceholder}>
								<View style={styles.cardBadgeRow}>
									<View style={styles.cardBadge} />
									<View style={styles.cardBadgeShort} />
								</View>
								<View style={styles.cardIllustration} />
								<View style={styles.cardButtonPill} />
							</View>
						))}
					</ScrollView>

					<Text style={[styles.sectionTitle, styles.comingSoonTitle]}>Coming Soon at NU Lipa!</Text>

					{/* SECTION: Calendar modal */}
					<Modal transparent visible={calendarVisible} animationType="fade" onRequestClose={closeCalendar}>
						<View style={styles.calendarOverlay}>
							<Pressable style={styles.calendarBackdrop} onPress={closeCalendar} />
							<View style={[styles.calendarCard, { width: calendarWidth }]}>
								<View style={styles.calendarHeader}>
									<TouchableOpacity style={styles.calendarNavButton} onPress={goToPreviousMonth} activeOpacity={0.8}>
										<Ionicons name="chevron-back" size={22} color="#31429B" />
									</TouchableOpacity>
									<Text style={styles.calendarTitle}>{monthLabel}</Text>
									<TouchableOpacity style={styles.calendarNavButton} onPress={goToNextMonth} activeOpacity={0.8}>
										<Ionicons name="chevron-forward" size={22} color="#31429B" />
									</TouchableOpacity>
								</View>

								<View style={styles.calendarPagerWindow} {...calendarPanResponder.panHandlers}>
									<Animated.View
										style={[
											styles.calendarPagerContent,
											{
												width: slideDistance,
												transform: [{ translateX: slideAnimation }],
											},
										]}
									>
										<View style={styles.calendarWeekRow}>
											{WEEKDAY_LABELS.map((weekday, index) => (
												<Text key={`${weekday}-${index}`} style={styles.calendarWeekLabel}>{weekday}</Text>
											))}
										</View>

										<View style={styles.calendarGrid}>
											{monthDays.map((day, index) => {
												const isToday =
													day &&
													new Date().getFullYear() === currentYear &&
													new Date().getMonth() === currentMonth &&
													new Date().getDate() === day;

												return (
													<View key={`${monthLabel}-${index}`} style={[styles.calendarDayCell, !day && styles.calendarDayCellEmpty]}>
														{day ? (
															<View style={[styles.calendarDayBubble, isToday && styles.calendarDayBubbleToday]}>
																<Text style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>{day}</Text>
															</View>
														) : null}
													</View>
												);
											})}
										</View>
									</Animated.View>
								</View>
							</View>
						</View>
					</Modal>

					{/* SECTION: Registrations modal */}
					<Modal transparent visible={registrationsVisible} animationType="fade" onRequestClose={closeRegistrations}>
						<View style={styles.calendarOverlay}>
							<Pressable style={styles.calendarBackdrop} onPress={closeRegistrations} />
							<View style={styles.registrationCard}>
								<View style={styles.registrationHeader}>
									<Text style={styles.registrationTitle}>Your Pre-Registered Events</Text>
									<TouchableOpacity style={styles.calendarNavButton} onPress={closeRegistrations} activeOpacity={0.8}>
										<Ionicons name="close" size={20} color="#31429B" />
									</TouchableOpacity>
								</View>

								{hasPreRegisteredEvents ? (
									<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.registrationList}>
										{PRE_REGISTERED_EVENTS.map((event) => (
											<View key={`registered-event-${event.id}`} style={styles.registrationItem}>
												<View style={styles.registrationIconWrap}>
													<Ionicons name="bookmark" size={18} color="#31429B" />
												</View>
												<View style={styles.registrationTextWrap}>
													<Text style={styles.registrationItemTitle}>{event.title}</Text>
													<Text style={styles.registrationItemMeta}>{event.date} • {event.location}</Text>
												</View>
											</View>
										))}
									</ScrollView>
								) : (
									<View style={styles.registrationEmptyState}>
										<View style={styles.registrationEmptyIconWrap}>
											<Image
												source={require('../../assets/icons/Group.png')}
												style={styles.registrationEmptyIcon}
												resizeMode="contain"
											/>
										</View>
										<Text style={styles.registrationEmptyText}>You have no pre-registered events yet.</Text>
										<TouchableOpacity style={styles.registrationOkayButton} activeOpacity={0.85} onPress={closeRegistrations}>
											<Text style={styles.registrationOkayButtonText}>Okay</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						</View>
					</Modal>

					{/* SECTION: Coming soon events */}
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.comingSoonRow}>
						{visibleComingSoonItems.map((item) => (
							<View key={`coming-soon-${item.id}`} style={styles.eventCard}>
								<View style={styles.eventImagePlaceholder} />
								<View style={styles.eventBody}>
									<View style={styles.eventTitleBlock} />
									<View style={styles.eventTitleShortBlock} />
									<View style={styles.eventMetaRow}>
										<View style={styles.eventMetaBlock} />
										<View style={styles.eventMetaBlockShort} />
									</View>
									<View style={styles.registerButton}>
										<Text style={styles.registerButtonText}>Pre-Register Now!</Text>
									</View>
								</View>
							</View>
						))}
					</ScrollView>

					{isSearching && !visibleFeaturedItems.length && !visibleComingSoonItems.length ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyStateTitle}>No matches found.</Text>
							<Text style={styles.emptyStateText}>Try a different search term.</Text>
						</View>
					) : null}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default EventsScreen;
