# 📡 API Endpoints

## 🔐 Authentication

### Register  
**POST** `/api/auth/register`  
- Auth: Not required  
- Description: Register a new user  

---

### Login  
**POST** `/api/auth/login`  
- Auth: Not required  
- Description: Authenticate user and return token  

---

### Google Login  
**POST** `/api/auth/google`  
- Auth: Not required  
- Description: Authenticate/register using Google  

---

### Logout  
**POST** `/api/auth/logout`  
- Auth: Not required  
- Description: Logout user  

---

### Get Current User  
**GET** `/api/auth/me`  
- Auth: Required  
- Description: Get current authenticated user  

---

## 👤 Users

### Get All Users  
**GET** `/api/users`  
- Auth: Required  
- Permissions: `USER_VIEW_ALL`  
- Description: Retrieve all users  

---

### Get User by ID  
**GET** `/api/users/:id`  
- Auth: Required  
- Permissions: Self or admin/moderator  
- Description: Retrieve specific user  

---

### Update User  
**PATCH** `/api/users/:id`  
- Auth: Required  
- Permissions: Self or admin  
- Description: Update user details  

---

### Soft Delete User  
**DELETE** `/api/users/:id`  
- Auth: Required  
- Description: Soft delete user  

---

### Force Delete User  
**DELETE** `/api/users/:id/force`  
- Auth: Required  
- Permissions: Admin only  
- Description: Permanently delete user  

---

### Restore User  
**POST** `/api/users/:id/restore`  
- Auth: Required  
- Permissions: Admin only  
- Description: Restore deleted user  

---

## 👤 Profiles

### Create Profile  
**POST** `/api/profiles`  
- Auth: Required  
- Description: Create profile with optional image  

---

### Get All Profiles  
**GET** `/api/profiles`  
- Auth: Required  
- Permissions: Admin/moderator  
- Description: Retrieve all profiles  

---

### Get My Profiles  
**GET** `/api/profiles/me`  
- Auth: Required  
- Description: Retrieve current user's profiles  

---

### Get Profiles by User  
**GET** `/api/profiles/user/:userId`  
- Auth: Required  
- Description: Retrieve profiles for a user  

---

### Get Profile by ID  
**GET** `/api/profiles/:id`  
- Auth: Required  
- Description: Retrieve specific profile  

---

### Update Profile  
**PATCH** `/api/profiles/:id`  
- Auth: Required  
- Description: Update profile  

---

### Delete Profile  
**DELETE** `/api/profiles/:id`  
- Auth: Required  
- Description: Delete profile  

---

## 🧴 Products

### Create Product  
**POST** `/api/products`  
- Auth: Required  
- Description: Create product manually  

---

### Create Product (Scan)  
**POST** `/api/products/scan`  
- Auth: Required  
- Description: Create product via image/AI  

---

### Get All Products  
**GET** `/api/products`  
- Auth: Required  
- Description: Retrieve all products  

---

### Get Product by ID  
**GET** `/api/products/:id`  
- Auth: Required  
- Description: Retrieve product  

---

### Update Product  
**PATCH** `/api/products/:id`  
- Auth: Required  
- Description: Update product  

---

### Delete Product  
**DELETE** `/api/products/:id`  
- Auth: Required  
- Description: Delete product  

---

### Product Image  
**GET** `/api/product-image`  
- Auth: Required  
- Description: Retrieve product image  

---

## ⚙️ Preferences

### Create Preference  
**POST** `/api/preferences`  
- Auth: Required  

---

### Get All Preferences  
**GET** `/api/preferences`  
- Auth: Required  

---

### Get by Profile  
**GET** `/api/preferences/profile/:profileId`  
- Auth: Required  

---

### Get Preference  
**GET** `/api/preferences/:id`  
- Auth: Required  

---

### Update Preference  
**PATCH** `/api/preferences/:id`  
- Auth: Required  

---

### Delete Preference  
**DELETE** `/api/preferences/:id`  
- Auth: Required  

---

## ⚠️ Allergens

### Create Allergen  
**POST** `/api/allergens`  
- Auth: Required  

---

### Get All Allergens  
**GET** `/api/allergens`  
- Auth: Required  

---

### Get by Profile  
**GET** `/api/allergens/profile/:profileId`  
- Auth: Required  

---

### Get Allergen  
**GET** `/api/allergens/:id`  
- Auth: Required  

---

### Update Allergen  
**PATCH** `/api/allergens/:id`  
- Auth: Required  

---

### Delete Allergen  
**DELETE** `/api/allergens/:id`  
- Auth: Required  

---

## 🩺 Conditions

### Create Condition  
**POST** `/api/conditions`  
- Auth: Required  

---

### Get All Conditions  
**GET** `/api/conditions`  
- Auth: Required  

---

### Get by Profile  
**GET** `/api/conditions/profile/:profileId`  
- Auth: Required  

---

### Get Condition  
**GET** `/api/conditions/:id`  
- Auth: Required  

---

### Update Condition  
**PATCH** `/api/conditions/:id`  
- Auth: Required  

---

### Delete Condition  
**DELETE** `/api/conditions/:id`  
- Auth: Required  

---

## 🧠 Evaluation Context

### Create Context  
**POST** `/api/evaluation-context`  

---

### Evaluate Product  
**POST** `/api/evaluation-context/evaluate`  

---

### Get All  
**GET** `/api/evaluation-context`  

---

### Get Mine  
**GET** `/api/evaluation-context/me`  

---

### Get by Profile  
**GET** `/api/evaluation-context/profile/:profileId`  

---

### Get by Product  
**GET** `/api/evaluation-context/product/:productId`  

---

### Re-evaluate  
**POST** `/api/evaluation-context/:id/reevaluate`  

---

### Get One  
**GET** `/api/evaluation-context/:id`  

---

### Update  
**PATCH** `/api/evaluation-context/:id`  

---

### Delete  
**DELETE** `/api/evaluation-context/:id`  

---

## 🌤️ Weather

### Get UV Index  
**GET** `/api/weather/uv?lat=<lat>&lon=<lon>`  
- Auth: Required  
- Description: Returns UV index for location  

---

## 🔐 Authentication Header

All protected routes require:
