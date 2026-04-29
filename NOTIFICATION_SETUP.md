# Push Notification System Setup Guide

## Frontend Setup (✅ Completed)

The push notification system is now fully configured on the mobile app side. Here's what was set up:

### Services & Contexts Created:

1. **`notificationService.js`** - Core notification service handling:
   - Permission requests
   - Push token management
   - Notification creation for all event types
   - Local notifications (for testing)

2. **`NotificationContext.js`** - Global notification state management:
   - Initializes notifications on app launch
   - Manages push tokens
   - Provides `useNotifications()` hook to screens

3. **`useNotificationListener.js`** - Hook for screens to listen to notifications and navigate

4. **`App.js`** - Updated to:
   - Wrap app with `NotificationProvider`
   - Handle notification taps and navigation

## Backend Setup Required

Your Laravel backend needs to implement the following:

### 1. Create Notification Endpoints

**Register Device Token:**
```
POST /api/notifications/register-device
Headers: Authorization: Bearer {token}
Body: {
  "push_token": "ExponentPushToken[...]"
}
```

Store this token in a `device_tokens` table:
```php
// Migration
Schema::create('device_tokens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->string('push_token')->unique();
    $table->string('platform')->nullable(); // ios, android, web
    $table->timestamp('last_used_at')->nullable();
    $table->timestamps();
});
```

### 2. Send Notifications from Events

Create a notification class that sends to Expo:

```php
// app/Services/ExpoNotificationService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ExpoNotificationService
{
    const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send notification via Expo
     */
    public static function send(array $tokens, string $title, string $body, array $data = [])
    {
        if (empty($tokens)) {
            return;
        }

        $messages = array_map(function ($token) use ($title, $body, $data) {
            return [
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'badge' => 1,
            ];
        }, $tokens);

        try {
            Http::post(self::EXPO_API_URL, $messages);
        } catch (\Exception $e) {
            \Log::error('Failed to send Expo notifications', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send notification to user
     */
    public static function sendToUser($user, string $title, string $body, array $data = [])
    {
        $tokens = $user->deviceTokens()->pluck('push_token')->toArray();
        self::send($tokens, $title, $body, $data);
    }
}
```

### 3. Send Notifications on Events

Add to your models/controllers:

```php
// When new event is created
use App\Services\ExpoNotificationService;

public function storeEvent(Request $request)
{
    $event = Event::create($request->validated());

    // Get all users
    $users = User::all();

    foreach ($users as $user) {
        ExpoNotificationService::sendToUser(
            $user,
            title: "New Event: {$event->title}",
            body: $event->description ?: 'A new event has been created',
            data: [
                'type' => 'event',
                'eventId' => $event->id,
                'screen' => 'EventDetailsScreen',
            ]
        );
    }

    return response()->json($event);
}

// When new message is sent
public function storeMessage(Request $request, $contactId)
{
    $message = Message::create([
        'sender_id' => auth()->id(),
        'receiver_id' => $contactId,
        'content' => $request->content,
    ]);

    $receiver = User::find($contactId);
    $sender = auth()->user();

    ExpoNotificationService::sendToUser(
        $receiver,
        title: "New Message from {$sender->first_name}",
        body: $message->content,
        data: [
            'type' => 'message',
            'messageId' => $message->id,
            'conversationId' => $contactId,
            'screen' => 'ConvoScreen',
        ]
    );

    return response()->json($message);
}

// When comment is added to post
public function storeComment(Request $request, $postId)
{
    $comment = Comment::create([
        'post_id' => $postId,
        'user_id' => auth()->id(),
        'content' => $request->content,
    ]);

    $post = Post::find($postId);
    $commenter = auth()->user();

    ExpoNotificationService::sendToUser(
        $post->user,
        title: "{$commenter->first_name} commented on your post",
        body: $comment->content,
        data: [
            'type' => 'comment',
            'commentId' => $comment->id,
            'postId' => $postId,
            'screen' => 'UserFeedScreen',
        ]
    );

    return response()->json($comment);
}

// When reaction is added
public function addReaction(Request $request, $postId)
{
    $reaction = Reaction::create([
        'post_id' => $postId,
        'user_id' => auth()->id(),
        'reaction' => $request->reaction,
    ]);

    $post = Post::find($postId);
    $reactor = auth()->user();

    ExpoNotificationService::sendToUser(
        $post->user,
        title: "{$reactor->first_name} reacted to your post",
        body: "{$request->reaction} your post",
        data: [
            'type' => 'reaction',
            'reactionId' => $reaction->id,
            'postId' => $postId,
            'screen' => 'UserFeedScreen',
        ]
    );

    return response()->json($reaction);
}

// When post is reposted
public function storeRepost(Request $request, $postId)
{
    $repost = Repost::create([
        'post_id' => $postId,
        'user_id' => auth()->id(),
    ]);

    $post = Post::find($postId);
    $reposter = auth()->user();

    ExpoNotificationService::sendToUser(
        $post->user,
        title: "{$reposter->first_name} reposted your post",
        body: "Reposted your post",
        data: [
            'type' => 'repost',
            'repostId' => $repost->id,
            'postId' => $postId,
            'screen' => 'UserFeedScreen',
        ]
    );

    return response()->json($repost);
}

// When new announcement is created
public function storeAnnouncement(Request $request)
{
    $announcement = Announcement::create($request->validated());

    $users = User::all();

    foreach ($users as $user) {
        ExpoNotificationService::sendToUser(
            $user,
            title: 'New Announcement',
            body: $announcement->content,
            data: [
                'type' => 'announcement',
                'announcementId' => $announcement->id,
                'screen' => 'HomeScreen',
            ]
        );
    }

    return response()->json($announcement);
}

// When new perk is available
public function storePerk(Request $request)
{
    $perk = Perk::create($request->validated());

    $users = User::all();

    foreach ($users as $user) {
        ExpoNotificationService::sendToUser(
            $user,
            title: 'New Perk Available',
            body: $perk->title,
            data: [
                'type' => 'perk',
                'perkId' => $perk->id,
                'screen' => 'PerksScreen',
            ]
        );
    }

    return response()->json($perk);
}
```

### 4. Configuration

Add to your `.env`:
```
EXPO_ACCESS_TOKEN=your_expo_access_token_if_needed
```

## Mobile App Usage

### In any screen, use the notification service:

```javascript
import { useNotifications } from '../context/NotificationContext';

export default function MyScreen() {
  const { notificationService, isPermissionGranted } = useNotifications();

  // Send test notification
  const testNotification = () => {
    notificationService.sendLocalNotification(
      'Test Title',
      'Test message body',
      { screen: 'HomeScreen' }
    );
  };

  return (
    <View>
      <Button title="Test Notification" onPress={testNotification} />
    </View>
  );
}
```

### Handle notification navigation:

```javascript
import { useNavigation } from '@react-navigation/native';
import { useNotificationListener } from '../hooks/useNotificationListener';

export default function MyScreen() {
  const navigation = useNavigation();
  
  // Automatically handle notification taps and navigate
  useNotificationListener(navigation);

  return (
    <View>
      {/* Screen content */}
    </View>
  );
}
```

## Testing

1. **Test permissions**: App will request notification permissions on first launch
2. **Test with Expo**: Use Expo notification testing at https://expo.io/dashboard
3. **Test with Expo Go**: Load your app in Expo Go to test on physical device
4. **Verify token**: Check browser console logs for push token

## Notification Types Supported

| Type | Trigger | Screen |
|------|---------|--------|
| event | New event created | EventDetailsScreen |
| announcement | New announcement | HomeScreen |
| message | New message sent | ConvoScreen |
| perk | New perk available | PerksScreen |
| reaction | Post reacted to | UserFeedScreen |
| comment | Post commented on | UserFeedScreen |
| repost | Post reposted | UserFeedScreen |

All notifications automatically include sound, badge, and haptic feedback.
