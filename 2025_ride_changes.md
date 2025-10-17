Okay, based on the `mobile/` directory structure, the backend API documentation (`new_api_endpoints.pdf`), and the analysis of the files you've shared (`AuthContext.tsx`, `book-ride.tsx`, `ride-tracking.tsx`, `ridesService.ts`, `socketService.ts`), here is a comprehensive map of the changes needed and new files to create for a fully functional ride-hailing flow integrated with the backend.

**Summary of Changes:**

The frontend currently has good structure and UI components (`book-ride`, `ride-tracking`) and service layers (`ridesService`, `socketService`) but they are misaligned with the actual backend API endpoints and WebSocket events. The `ridesService` uses incorrect endpoint paths and parameter structures for core ride functions. The `socketService` listens for incorrect event names emitted by the backend. Mock data is used extensively.

**Files to Update:**

1.  **`services/ridesService.ts`**
    *   **Purpose:** Align API calls with the backend's actual endpoints and request/response structures.
    *   **Changes:**
        *   **Update Endpoint Paths:**
            *   `getRideDetails(rideId)` should call `GET /api/v1/rides/{id}/status` (currently `/api/v1/rides/{id}`).
            *   `updateLocation(rideId, lat, lng)` should call `POST /api/v1/tracking/{ride_id}/update` (currently `/api/v1/rides/{rideId}/location`).
            *   `getRides(...)` calls `GET /api/v1/rides/` (this is correct for the main list endpoint, filtering happens via role).
            *   `requestRide(...)` calls `POST /api/v1/rides/request` (this is correct).
            *   `acceptRide(requestId)` calls `PUT /api/v1/rides/{id}/accept` (currently `/api/v1/rides/requests/{id}/accept` - this path is incorrect, the backend uses `/rides/{id}/accept` and expects the *ride ID*, not a separate request ID).
            *   `declineRide(requestId)` calls `PUT /api/v1/rides/{id}/reject` (currently `/api/v1/rides/requests/{id}/decline` - similar issue, use ride ID).
            *   `startRide(rideId)` calls `PUT /api/v1/rides/{id}/start` (this is correct).
            *   `completeRide(rideId)` calls `PUT /api/v1/rides/{id}/complete` (this is correct).
            *   `updateDriverLocation(...)` calls `POST /api/v1/tracking/update` (this is correct).
            *   `getAvailableDrivers(...)` calls `GET /api/v1/drivers/available` (this is correct for admin view, riders don't directly call this - matching happens on backend during `requestRide`).
        *   **Update Request Bodies:** Ensure the data structure sent matches the backend's `RideCreate`, `RideUpdate`, etc., schemas as per the PDF.
        *   **Update Response Handling:** Ensure the data structure received matches the backend's `RidePublic`, `RideWithDetails`, etc., schemas.
        *   **Remove/Refactor Mock Implementations:** Gradually remove or disable mock implementations as the real backend API is confirmed to work. The mock implementations for complex operations like `findDriverMatch` might be removed entirely as the backend handles this.
        *   **Handle Role-Based Access:** Ensure the service correctly handles different user roles (rider/driver/courier) for appropriate endpoints (e.g., a rider shouldn't call `acceptRide` unless they are a driver).

2.  **`services/socketService.ts`**
    *   **Purpose:** Align WebSocket event listeners and room management with the backend's `websocket_service.py`.
    *   **Changes:**
        *   **Install `socket.io-client`:** `npm install socket.io-client`
        *   **Import `socket.io-client`:** `import io, { Socket as SocketIOClient } from 'socket.io-client';`
        *   **Update Connection Logic:** Replace `new window.io(...)` with `io(baseUrl, options)`.
        *   **Update Event Listeners in `setupRealSocketHandlers`:**
            *   Listen for `driver:ride_assigned` instead of `ride:driver_assigned`.
            *   Listen for `ride:cancelled` instead of `ride:cancelled_by_rider`/`ride:cancelled_by_driver`.
            *   Listen for `driver:assignment_timeout` (if needed for UI feedback).
            *   Keep listening for `ride:status_update` and `ride:location_update` (these seem to match).
        *   **Update Room Join/Leave Logic:** Ensure `subscribeToRide`/`unsubscribeFromRide` correctly emit `join_room`/`leave_room` events with the format expected by the backend (e.g., `{ room: 'ride:{rideId}' }` or `{ user_id, role, room }`).
        *   **Pass User Info:** Ensure the user ID and role are correctly passed during the initial connection or room join/leave events so the backend can manage rooms properly. This might involve passing them from `AuthContext` or storing them after connection.
        *   **Implement `getUserId()` and `getUserRole()`:** Create functions to fetch the current user's ID and role from `AuthContext` or storage to use in socket operations.

3.  **`app/(dashboard)/book-ride.tsx`**
    *   **Purpose:** Initiate the ride request flow and handle initial status updates via WebSocket.
    *   **Changes:**
        *   **Call Correct Service:** Use the updated `ridesService.requestRide(...)`.
        *   **Handle Response:** Capture the `ride.id` from the successful API call.
        *   **WebSocket Integration:** Listen for `ride:status_update` events (via `socketService`).
        *   **Handle Status Updates:**
            *   `status: 'accepted'`: Navigate to `ride-tracking.tsx` with the `ride.id`.
            *   `status: 'cancelled'` (e.g., due to no drivers): Show an error message.
            *   `status: 'rejected'` (if backend sends this during initial search): Handle accordingly.
        *   **Navigation:** After calling `requestRide`, navigate to a "waiting for driver" screen (could be `ride-tracking.tsx` if it handles the `requested` state well, or a dedicated intermediate screen like `driver-selection.tsx`).

4.  **`app/(dashboard)/ride-tracking.tsx`**
    *   **Purpose:** Display driver location, ride status, and handle driver actions during the ride.
    *   **Changes:**
        *   **WebSocket Integration:** Ensure it listens for `ride:status_update` and `ride:location_update` via `socketService`.
        *   **Handle Status Updates:**
            *   `status: 'accepted'`: Show driver assigned details.
            *   `status: 'in_progress'`: Show "Trip in Progress".
            *   `status: 'completed'`: Navigate to `ride-completion.tsx`.
            *   `status: 'cancelled'`: Show cancellation message, navigate away.
        *   **Handle Location Updates:** Receive `latitude`/`longitude` from `ride:location_update` and update the map/driver position indicator.
        *   **Call Correct Service:** Use updated `ridesService.startRide` and `ridesService.completeRide`.
        *   **Subscribe/Unsubscribe:** Correctly subscribe to the ride room when component mounts and unsubscribe when it unmounts using `socketService`.

5.  **`contexts/AuthContext.tsx` (Potentially)**
    *   **Purpose:** Ensure user ID and role are readily available for services like `socketService`.
    *   **Changes (if needed):**
        *   Ensure the `User` interface and state include `id` and `role`.
        *   If `socketService` needs the user ID/role immediately upon connection (not just when joining a room), ensure `AuthContext` provides a synchronous way to access them (e.g., `state.user.id`, `state.user.role`) or pass them during initialization.

**New Files to Create:**

1.  **`contexts/RideContext.tsx` (Recommended)**
    *   **Purpose:** Manage the state of the *current* ride request throughout the ride lifecycle (requested, accepted, in_progress, completed/cancelled). This centralizes ride data and status, making it easier to manage across screens like `book-ride`, `ride-tracking`, etc.
    *   **State to Manage:**
        *   `currentRide: Ride | null` (the full ride object)
        *   `rideStatus: RideStatus | null` (e.g., 'requested', 'accepted', 'in_progress', 'completed', 'cancelled')
        *   `driverLocation: { latitude: number, longitude: number } | null`
        *   `isRideActive: boolean`
    *   **Actions:**
        *   `setRideDetails(ride: Ride)`
        *   `updateRideStatus(status: RideStatus)`
        *   `updateDriverLocation(location: { latitude: number, longitude: number })`
        *   `clearCurrentRide()`
    *   **Integration:** Wrap relevant parts of the app (e.g., `(dashboard)` screens related to rides) with `RideProvider`. Components like `book-ride` and `ride-tracking` can use `useRideContext` to access and update ride state based on API calls and WebSocket events.

2.  **`app/(dashboard)/ride-completion.tsx` (if not fully handled by `ride-tracking`)**
    *   **Purpose:** Display ride summary (fare, duration, rating prompt) after a ride is completed.
    *   **Changes/Creation:**
        *   Fetch final ride details using `ridesService.getRideDetails(rideId)` or use data passed from `ride-tracking`.
        *   Allow user to rate the ride using `ridesService.rateRide(rideId, rating)`.
        *   Display fare, distance, duration, driver info.
        *   Provide options to return to home or request another ride.

3.  **`app/(dashboard)/driver-selection.tsx` (if `book-ride` doesn't handle the waiting state directly)**
    *   **Purpose:** Show a screen while the system is finding/assigning a driver, potentially allowing cancellation.
    *   **Changes/Creation:**
        *   Receive `rideId` from `book-ride`.
        *   Listen for WebSocket status updates (`accepted`, `cancelled`, `no_drivers`).
        *   Show "Finding driver..." message.
        *   Allow cancellation using `ridesService.cancelRideByRider(rideId, reasonId)`.
        *   Navigate to `ride-tracking` on `accepted`.

**Key Integration Points:**

*   **API Calls:** Use `ridesService` methods for all communication with the backend ride/tracking endpoints.
*   **Real-time Updates:** Use `socketService` to listen for events from the backend (`ride:status_update`, `ride:location_update`, `driver:ride_assigned`, `ride:cancelled`).
*   **State Management:** Use `AuthContext` for user identity and `RideContext` (if created) for ride-specific state.
*   **Navigation:** Use `router.push`/`router.replace` from `expo-router` to move between screens based on API results and WebSocket events.

By making these changes and creating the new context/file, the frontend will be properly aligned with the backend API and WebSocket events, enabling a fully functional ride-hailing experience.