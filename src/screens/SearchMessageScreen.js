import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/SearchMessageScreen.styles';

const SUGGESTED_PEOPLE = [
	{
		id: 1,
		name: 'Gutierrez, Louie Andrew',
		avatarUri: 'https://i.pravatar.cc/150?img=12',
	},
	{
		id: 2,
		name: 'Caponpon, Jade Ahrens',
		avatarUri: 'https://i.pravatar.cc/150?img=32',
	},
	{
		id: 3,
		name: 'Asada, Timothy John',
		avatarUri: 'https://i.pravatar.cc/150?img=15',
	},
	{
		id: 4,
		name: 'Claus, Johannes Emmanuel',
		avatarUri: 'https://i.pravatar.cc/150?img=61',
	},
	{
		id: 5,
		name: 'Hernandez, Gian Accel',
		avatarUri: 'https://i.pravatar.cc/150?img=24',
	},
	{
		id: 6,
		name: 'De Guzman, Dexter',
		avatarUri: 'https://i.pravatar.cc/150?img=18',
	},
	{
		id: 7,
		name: 'Balmes, Christian Miguel',
		avatarUri: 'https://i.pravatar.cc/150?img=27',
	},
	{
		id: 8,
		name: 'Magsino, Christian',
		avatarUri: 'https://i.pravatar.cc/150?img=45',
	},
	{
		id: 9,
		name: 'Fernando, Julianne Kaye',
		avatarUri: 'https://i.pravatar.cc/150?img=47',
	},
	{
		id: 10,
		name: 'Manalo, Marian Justine',
		avatarUri: 'https://i.pravatar.cc/150?img=65',
	},
];

const SearchMessageScreen = ({ navigation }) => {
	const { width } = useWindowDimensions();
	const isCompactWidth = width < 375;
	const horizontalPadding = isCompactWidth ? 14 : 16;
	const avatarSize = isCompactWidth ? 40 : 42;

	const [query, setQuery] = useState('');

	const filteredPeople = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			return SUGGESTED_PEOPLE;
		}

		return SUGGESTED_PEOPLE.filter((person) => {
			return person.name.toLowerCase().includes(normalizedQuery);
		});
	}, [query]);

	const renderSuggestedPerson = ({ item }) => (
		<Pressable style={styles.resultRow} onPress={() => {}} android_ripple={{ color: '#F1F5F9' }}>
			<Image
				source={{ uri: item.avatarUri }}
				style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
			/>
			<Text style={styles.resultName} numberOfLines={1}>
				{item.name}
			</Text>
		</Pressable>
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />
				<FlatList
					data={filteredPeople}
					renderItem={renderSuggestedPerson}
					keyExtractor={(item) => String(item.id)}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					ListHeaderComponent={(
						<View>
							<View style={styles.headerRow}>
								<Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
									<Ionicons name="arrow-back" size={24} color="#4A4A4A" />
								</Pressable>
								<Text style={styles.title}>Search</Text>
							</View>

							<View style={styles.searchWrap}>
								<TextInput
									value={query}
									onChangeText={setQuery}
									placeholder="Search a name or group"
									placeholderTextColor="#6D6D6D"
									style={styles.searchInput}
								/>
							</View>

							<Text style={styles.sectionLabel}>Suggested</Text>
						</View>
					)}
					ListEmptyComponent={(
						<View style={styles.emptyWrap}>
							<Text style={styles.emptyText}>No matching names or groups found.</Text>
						</View>
					)}
					contentContainerStyle={[
						styles.content,
						styles.resultsList,
						{ paddingHorizontal: horizontalPadding, paddingBottom: 24 },
					]}
				/>
			</View>
		</SafeAreaView>
	);
};

export default SearchMessageScreen;