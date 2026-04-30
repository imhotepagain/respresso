# Respresso Platform Features

This document outlines all the core features currently implemented in the Respresso application. These can serve as a reference for your new tablet-based standby platform.

## 1. Gaming / PlayStation Tracker (Sessions)
- **Station Management Tracker**: Manage up to 6 distinct gaming stations (PlayStation posts).
- **Session Modes**:
  - **Timed Mode**: Fixed duration sessions (e.g., 30 mins, 1 hr, 2 hr, custom limit) with real-time countdown.
  - **Unlimited Mode**: Open-ended sessions where time counts up, and charge is calculated at the end.
- **Cost Calculation**: Automated cost suggestions based on elapsed time (e.g., standard rate of 5 DH per 14-minute match).
- **Session Lifecycle**: Options to Start, Cancel, or Finish/Complete securely.
- **Notifications & Alerts**: Visual cues and system notifications when a Timed session expires.
- **Session History**: Comprehensive table to review recent sessions, durations, and costs.

## 2. Point of Sale (POS) Interface
- **Categorized Products**: Filter products by Snacks, Drinks, Services, or view All.
- **Cart Management**: Add, remove, or adjust quantities of items to cart.
- **Stock Validation**: Automatically prevents selling out-of-stock items.
- **Flexible Checkout**: 
  - **Cash Payment** for walk-in guests or immediate settlement.
  - **Debt Payment** to assign the purchase directly to a registered Client's tab.
- **Search System**: Real-time search bar to quickly find items.

## 3. Inventory Control
- **Product Management**: Create, update, and delete products with attributes like Name, Category, Price, and Initial Stock.
- **Live Stock Tracking**: Real-time insight into what is available.
- **Stock Alerts**: Automatic low stock definitions and "sold out" indicators.
- **Restocking**: A dedicated feature to add new inventory logically while calculating the restock cost.

## 4. Debts & Client Accounts
- **Client Profiles**: Create accounts for regular customers to track tabs/debts.
- **Debt Tracking**: Overview of all money currently owed by clients (Total Outstanding).
- **Payment Processing**: Record partial or full debt repayments securely.
- **Account Status**: Visual indicators to highlight whose account is balanced and who is in debt.

## 5. Team & Administrative Features
- **Role-Based Access Control (RBAC)**: Secure separation between "OWNER" and standard staff (e.g., staff can run POS, only owner can view Team/Settings).
- **Setup Initialization**: Secure setup screen checking if the system has initial users.
- **Authentication**: Login protections for application usage.

## 6. Reports & System Overview
- **Analytics Dashboard**: Overview of live data and historical operations.
- **Data Export/Metrics**: Insights into total revenue, most popular items, or busiest station (based on implicit POS structure). 

---
*Since your new platform will be built for a tablet in standby mode, consider emphasizing touch-friendly large targets (already somewhat present in the UI cards) and a streamlined "always-on" dashboard approach, minimizing clicks.*
