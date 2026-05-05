import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { mockChats, mockMessages } from '../data/mockData';

export default function ChatScreen() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  if (selectedChat) {
    const chat = mockChats.find((c) => c.id === selectedChat);
    const messages = mockMessages[selectedChat] || [];

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Image source={{ uri: chat?.userPhoto }} style={styles.chatHeaderAvatar} />
            <Text style={styles.chatHeaderName}>{chat?.userName}</Text>
          </View>
        </View>

        <ScrollView style={styles.messagesContainer}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.messageBubble, message.isMe && styles.messageBubbleMe]}
            >
              <Text
                style={[styles.messageText, message.isMe && styles.messageTextMe]}
              >
                {message.text}
              </Text>
              <Text
                style={[styles.messageTime, message.isMe && styles.messageTimeMe]}
              >
                {message.timestamp}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
          />
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={mockChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => setSelectedChat(item.id)}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
              {item.isActive && <View style={styles.activeIndicator} />}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatRow}>
                <Text style={styles.chatName}>{item.userName}</Text>
                <Text style={styles.chatTimestamp}>{item.timestamp}</Text>
              </View>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chatTimestamp: {
    fontSize: 14,
    color: '#999999',
  },
  chatMessage: {
    fontSize: 15,
    color: '#666666',
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8C1515',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 16,
    color: '#8C1515',
    marginBottom: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  messageBubbleMe: {
    backgroundColor: '#8C1515',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    color: '#000000',
  },
  sendButton: {
    backgroundColor: '#8C1515',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
