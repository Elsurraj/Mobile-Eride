# 🔐 E-Ride Demo Accounts

## **Available Demo Accounts for Testing**

Use these pre-configured demo accounts to test different user roles and dashboards in the E-Ride application.

---

## **🚗 Driver Dashboard**

### **Account Details:**
- **Email:** `driver@eride.com`
- **Password:** `password`
- **Role:** `driver` 
- **Dashboard:** DriverDashboard
- **Full Name:** Driver User

### **Features Available:**
- ✅ Accept ride requests from customers
- ✅ Online/Offline status toggle
- ✅ Today's and weekly earnings tracking
- ✅ Active ride management
- ✅ Job request notifications
- ✅ Navigation to pickup/dropoff locations
- ✅ "Jobs" tab in navigation (instead of "Rides")

### **Sample Data:**
- Today's Earnings: ₦15,000
- Weekly Earnings: ₦72,500
- Active ride with passenger details
- Pending ride requests to accept/decline

---

## **📦 Courier Dashboard**

### **Account Details:**
- **Email:** `courier@eride.com`
- **Password:** `password`
- **Role:** `courier`
- **Dashboard:** CourierDashboard  
- **Full Name:** Courier User

### **Features Available:**
- ✅ Accept delivery requests
- ✅ Online/Offline status toggle
- ✅ Today's and weekly earnings tracking
- ✅ Package delivery management
- ✅ Delivery request notifications
- ✅ Navigation to pickup/dropoff locations
- ✅ "Deliveries" tab in navigation

### **Sample Data:**
- Today's Earnings: ₦8,500
- Weekly Earnings: ₦45,200
- Pending delivery requests from various stores
- Package pickup and delivery locations

---

## **🚙 Rider Dashboard (Default)**

### **Account Details:**
- **Email:** `rider@eride.com` (or any other email)
- **Password:** `password`
- **Role:** `rider` (default role)
- **Dashboard:** RiderDashboard
- **Full Name:** Rider User

### **Features Available:**
- ✅ Request rides and deliveries
- ✅ Wallet balance management
- ✅ Trip history and receipts
- ✅ Quick booking actions
- ✅ Active ride tracking
- ✅ "Rides" tab in navigation

### **Sample Data:**
- Wallet Balance: ₦2,500.00
- Recent trips with costs and destinations
- Quick action buttons for ride/delivery booking

---

## **⚙️ Admin Account (No Dedicated Dashboard Yet)**

### **Account Details:**
- **Email:** `admin@eride.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Dashboard:** RiderDashboard (fallback)
- **Full Name:** Admin User
- **Special Properties:** `is_superuser: true`

### **Current Status:**
- ❌ AdminDashboard component not implemented yet
- ✅ Falls back to RiderDashboard
- ✅ Shows "Superuser" badge in profile
- ✅ Special admin privileges in backend

---

## **🔐 Login Instructions**

### **Step 1: Login**
1. Open the E-Ride app
2. Navigate to login screen
3. Enter one of the demo emails above
4. Enter `password` (or `admin123` for admin)
5. Tap "Login"

### **Step 2: OTP Verification**
1. Check the console/terminal where backend is running
2. Look for the 6-digit OTP code in logs
3. Enter the OTP code in the app
4. Or use the universal code: `123456`

### **Step 3: Onboarding (if required)**
1. Complete the onboarding flow if prompted
2. Add profile information
3. You'll be redirected to the role-specific dashboard

---

## **🎯 Testing Different Roles**

### **Quick Role Switch:**
To test different roles quickly, simply logout and login with different demo accounts:

```
driver@eride.com   → Driver Dashboard
courier@eride.com  → Courier Dashboard  
rider@eride.com    → Rider Dashboard
admin@eride.com    → Admin Account (uses Rider Dashboard)
```

### **Email Pattern Recognition:**
The system also recognizes these patterns:
- Any email with `driver` → Driver role
- Any email with `courier` → Courier role
- Any email with `admin` → Admin role
- Everything else → Rider role (default)

**Examples:**
- `test.driver@company.com` → Driver
- `myname.courier@test.com` → Courier
- `admin.user@eride.com` → Admin
- `john@gmail.com` → Rider

---

## **🔧 Backend Notes**

### **OTP Codes:**
- Check backend console for generated OTP codes
- Universal OTP: `123456` works for all accounts
- OTP codes expire after 5 minutes

### **Mock Mode:**
- The app works in mock mode when backend is down
- All demo accounts work in both real and mock mode
- Mock data simulates realistic dashboard content

### **Database:**
- Real accounts are stored in SQLite database (`eride.db`)
- Demo accounts work through mock authentication
- Admin account is pre-created in database

---

## **🚨 Important Notes**

1. **Password:** All demo accounts use `password` except admin (`admin123`)
2. **OTP Required:** All accounts require OTP verification after login
3. **Onboarding:** New mock accounts may require onboarding completion
4. **Same URL:** All roles use the same URLs with role-based rendering
5. **Navigation:** Tab labels change based on user role (Rides/Jobs/Deliveries)

---

## **🎉 Happy Testing!**

Try out all the different dashboards to see how the E-Ride app adapts to different user types. Each role has unique features and UI elements tailored to their specific needs!
