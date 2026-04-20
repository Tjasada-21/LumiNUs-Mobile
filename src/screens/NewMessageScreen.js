import React, { useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BrandHeader from '../components/BrandHeader';
import SmartTextInput from '../components/SmartTextInput';
import styles from '../styles/NewMessageScreen.styles';

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

const NewMessageScreen = ({ navigation }) => {
	// SECTION: Layout values
	const { width } = useWindowDimensions();
	const isCompactWidth = width < 375;
	const horizontalPadding = isCompactWidth ? 14 : 16;
	const avatarSize = isCompactWidth ? 40 : 42;

	const [query, setQuery] = useState('');
	const [groupModalVisible, setGroupModalVisible] = useState(false);
	const [groupName, setGroupName] = useState('');
	const [memberQuery, setMemberQuery] = useState('');
	const [selectedMembers, setSelectedMembers] = useState([]);

	// DERIVED VALUE: Filtered people list
	const filteredPeople = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			return SUGGESTED_PEOPLE;
		}

		return SUGGESTED_PEOPLE.filter((person) => {
			return person.name.toLowerCase().includes(normalizedQuery);
		});
	}, [query]);

	// DERIVED VALUE: Filtered members for the group modal
	const filteredMembers = useMemo(() => {
		const normalizedQuery = memberQuery.trim().toLowerCase();

		if (!normalizedQuery) {
			return SUGGESTED_PEOPLE;
		}

		return SUGGESTED_PEOPLE.filter((person) => {
			return person.name.toLowerCase().includes(normalizedQuery);
		});
	}, [memberQuery]);

	// DERIVED VALUE: Selected member display names
	const selectedMemberNames = useMemo(() => selectedMembers.map((person) => person.name), [selectedMembers]);

	// HANDLER: Open the group chat modal
	const openGroupChatModal = () => {
		setGroupModalVisible(true);
	};

	// HANDLER: Close the group chat modal
	const closeGroupChatModal = () => {
		setGroupModalVisible(false);
		setGroupName('');
		setMemberQuery('');
	};

	// HANDLER: Toggle a member in the group chat list
	const toggleMemberSelection = (member) => {
		setSelectedMembers((currentMembers) => {
			const exists = currentMembers.some((item) => item.id === member.id);

			if (exists) {
				return currentMembers.filter((item) => item.id !== member.id);
			}

			return [...currentMembers, member];
		});
	};

	// HANDLER: Create the group chat from selected members
	const handleCreateGroupChat = () => {
		closeGroupChatModal();
	};

	// RENDER HELPER: Suggested person row
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

	// RENDER HELPER: Group member row
	const renderMemberRow = ({ item }) => {
		const isSelected = selectedMembers.some((member) => member.id === item.id);

		return (
			<Pressable
				style={styles.memberRow}
				onPress={() => toggleMemberSelection(item)}
				android_ripple={{ color: '#F1F5F9' }}
			>
				<Image
					source={{ uri: item.avatarUri }}
					style={[styles.memberAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
				/>
				<View style={styles.memberTextWrap}>
					<Text style={styles.memberName} numberOfLines={1}>
						{item.name}
					</Text>
					<Text style={styles.memberMeta}>{isSelected ? 'Selected' : 'Tap to add to the group'}</Text>
				</View>
				<View style={[styles.memberCheckCircle, isSelected && styles.memberCheckCircleSelected]}>
					{isSelected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
				</View>
			</Pressable>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />
				{/* SECTION: Message composer */}
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
								<Text style={styles.title}>New message</Text>
							</View>

							<View style={styles.searchWrap}>
								<TextInput
									value={query}
									onChangeText={setQuery}
									placeholder="Type a name or group"
									placeholderTextColor="#6D6D6D"
									style={styles.searchInput}
								/>
							</View>

							<View style={styles.actionsRow}>
								<Pressable style={styles.groupChatButton} onPress={openGroupChatModal} android_ripple={{ color: '#EAF0FF' }}>
									<Ionicons name="people-outline" size={18} color="#31429B" />
									<Text style={styles.groupChatButtonText}>Create group chat</Text>
								</Pressable>

								<Pressable style={styles.notesButton} onPress={() => {}} android_ripple={{ color: '#EAF0FF' }}>
									<Ionicons name="document-text-outline" size={18} color="#31429B" />
									<Text style={styles.notesButtonText}>Add notes</Text>
								</Pressable>
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

				<Modal transparent visible={groupModalVisible} animationType="fade" onRequestClose={closeGroupChatModal}>
					<View style={styles.modalOverlay}>
						<Pressable style={styles.modalBackdrop} onPress={closeGroupChatModal} />
						<View style={styles.modalCard}>
							<View style={styles.modalHeader}>
								<Text style={styles.modalTitle}>Add members</Text>
								<Pressable style={styles.modalCloseButton} onPress={closeGroupChatModal} hitSlop={8}>
									<Ionicons name="close" size={22} color="#31429B" />
								</Pressable>
							</View>

							<Text style={styles.modalSubtitle}>Choose people to include in the group chat.</Text>

							<Text style={styles.modalFieldLabel}>Group chat name</Text>
							<SmartTextInput
								value={groupName}
								onChangeText={setGroupName}
								placeholder="Enter a group chat name"
								placeholderTextColor="#7A7A7A"
								style={styles.modalNameInput}
							/>

							<View style={styles.modalSearchWrap}>
								<Ionicons name="search-outline" size={18} color="#7A7A7A" />
								<TextInput
									value={memberQuery}
									onChangeText={setMemberQuery}
									placeholder="Search members"
									placeholderTextColor="#7A7A7A"
									style={styles.modalSearchInput}
								/>
							</View>

							{selectedMemberNames.length > 0 ? (
								<View style={styles.selectedWrap}>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedChipsRow}>
										{selectedMemberNames.map((name) => (
											<View key={name} style={styles.selectedChip}>
												<Text style={styles.selectedChipText}>{name}</Text>
											</View>
										))}
									</ScrollView>
								</View>
							) : null}

							<FlatList
								data={filteredMembers}
								renderItem={renderMemberRow}
								keyExtractor={(item) => String(item.id)}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={styles.modalList}
								ListEmptyComponent={(
									<View style={styles.emptyWrap}>
										<Text style={styles.emptyText}>No matching members found.</Text>
									</View>
								)}
							/>

							<View style={styles.modalActionsRow}>
								<Pressable style={styles.modalSecondaryButton} onPress={closeGroupChatModal} android_ripple={{ color: '#EAF0FF' }}>
									<Text style={styles.modalSecondaryButtonText}>Cancel</Text>
								</Pressable>
								<Pressable style={styles.modalPrimaryButton} onPress={handleCreateGroupChat} android_ripple={{ color: '#24346F' }}>
									<Text style={styles.modalPrimaryButtonText}>Create Group</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
};

export default NewMessageScreen;
