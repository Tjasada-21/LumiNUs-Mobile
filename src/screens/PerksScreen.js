import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/PerksScreen.styles';

const formatValidUntil = (value) => {
  if (!value) {
    return 'No expiry date';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
};

const getPerkImageUri = (perk) => {
	const directImageSources = [perk?.image_url, perk?.image_path, perk?.image, perk?.photo]
		.filter(Boolean)
		.map((value) => String(value).trim());

	if (directImageSources.length > 0) {
		return directImageSources[0];
	}

  const firstImage = perk?.images?.[0];

  if (!firstImage) {
    return null;
  }

	return firstImage.image_url || firstImage.url || firstImage.image_path || firstImage.path || null;
};

const resolveImageUri = (value) => {
	if (!value) {
		return null;
	}

	const rawUri = String(value).trim();

	if (/^https?:\/\//i.test(rawUri) || rawUri.startsWith('data:') || rawUri.startsWith('file://')) {
		return rawUri;
	}

	const baseUrl = String(api.defaults.baseURL ?? '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
	const normalizedPath = rawUri.replace(/^\/+/, '');

	return baseUrl ? `${baseUrl}/${normalizedPath}` : rawUri;
};

const PerksScreen = ({ navigation }) => {
	const { width } = useWindowDimensions();
	const isTablet = width >= 768;
	const isCompactWidth = width < 375;
	const cardGap = 12;
	const horizontalPadding = isCompactWidth ? 12 : 16;
	const cardWidth = useMemo(() => {
		const availableWidth = width - horizontalPadding * 2 - cardGap;
		return Math.floor(availableWidth / 2);
	}, [cardGap, horizontalPadding, width]);

	const [perks, setPerks] = useState([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const fetchPerks = async () => {
		try {
			setErrorMessage('');
			const response = await api.get('/perks');
			setPerks(response.data?.perks ?? []);
		} catch (error) {
			console.error('Failed to load perks:', error);
			setErrorMessage('Unable to load perks right now.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchPerks();
	}, []);

	const filteredPerks = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			return perks;
		}

		return perks.filter((perk) => {
			return [perk.title, perk.description]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(normalizedQuery));
		});
	}, [perks, query]);

	const renderPerkCard = ({ item }) => {
		const imageUri = resolveImageUri(getPerkImageUri(item));

		return (
			<Pressable style={[styles.card, { width: cardWidth }]}>
				<View style={styles.cardImageWrap}>
					{imageUri ? (
						<Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
					) : (
						<View style={styles.cardImagePlaceholder}>
							<Ionicons name="pricetag-outline" size={34} color="#9CA3AF" />
							<Text style={styles.placeholderText}>No image</Text>
						</View>
					)}
				</View>

				<Text style={styles.cardTitle} numberOfLines={2}>
					{item.title}
				</Text>

				<Text style={styles.cardDescription} numberOfLines={3}>
					{item.description}
				</Text>

				<View style={styles.cardFooter}>
					<Ionicons name="calendar-outline" size={14} color="#666666" />
					<Text style={styles.cardFooterText}>Valid until {formatValidUntil(item.valid_until)}</Text>
				</View>
			</Pressable>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				<View style={styles.content}>
					<View style={styles.searchWrap}>
						<Ionicons name="search-outline" size={22} color="#7B7B7B" style={styles.searchIcon} />
						<TextInput
							value={query}
							onChangeText={setQuery}
							placeholder="Search for Perks and Discounts"
							placeholderTextColor="#7B7B7B"
							style={styles.searchInput}
						/>
					</View>

					<Text style={[styles.heading, isTablet && styles.headingTablet]}>Explore All Discounts and Perks!</Text>

					{loading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator size="large" color="#31429B" />
							<Text style={styles.loadingText}>Loading perks...</Text>
						</View>
					) : errorMessage ? (
						<View style={styles.stateWrap}>
							<Text style={styles.stateTitle}>Could not load perks</Text>
							<Text style={styles.stateText}>{errorMessage}</Text>
							<Pressable style={styles.retryButton} onPress={() => {
								setLoading(true);
								fetchPerks();
							}}>
								<Text style={styles.retryButtonText}>Try Again</Text>
							</Pressable>
						</View>
					) : (
						<FlatList
							data={filteredPerks}
							renderItem={renderPerkCard}
							keyExtractor={(item) => String(item.id)}
							numColumns={2}
							columnWrapperStyle={filteredPerks.length > 1 ? styles.gridRow : undefined}
							contentContainerStyle={styles.gridContent}
							showsVerticalScrollIndicator={false}
							refreshing={refreshing}
							onRefresh={() => {
								setRefreshing(true);
								fetchPerks();
							}}
							ListEmptyComponent={(
								<View style={styles.stateWrap}>
									<Text style={styles.stateTitle}>No perks found</Text>
									<Text style={styles.stateText}>
										Try a different search term or check back later.
									</Text>
								</View>
							)}
						/>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
};

export default PerksScreen;
