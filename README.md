# ⭐ Expo Router v3 root
├── (app)/                    # ⭐ Main app section (protected routes)
│   ├── _layout.js           # ⭐ Main app layout (with navbar)
│   ├── dashboard/           # ⭐ Tab group for main sections
│   │   ├── _layout.js       # ⭐ Tab navigator
│   │   └── index.js          # → /index page
│   ├── search/              # ⭐ Search section
│   │   ├── _layout.js       # ⭐ Search layout
│   │   └── index.js         # → /search
│   │   └── [companyId].tsx  # → /particular company
│   ├── Lead/              # ⭐ Lead section
│   │   ├── _layout.js       # ⭐ Lead layout
│   │   ├── [companyId].tsx  # ⭐ specific company details
│   │   ├── products.tsx  # ⭐ showing the products
│   │   └── index.js         # → /lead
│   │   └── subscriprition.js# → /subscriprition
│   ├── bizzapai/              # ⭐ bizzapai section
│   │   ├── _layout.js       # ⭐ bizzapai layout
│   │   └── index.js         # → /bizzapai
│   │   └── create-post.tsx  # →/create posts manually
│   ├── profile/             # ⭐ Profile section  
│   │   ├── _layout.js       # ⭐ Profile layout
│   │   ├── accounts-center.tsx     # → /profile
│   │   ├── index.js           # → /settings screen
│   │   ├── my_lead.js         # → /lead management
│   │   ├── notifications.tsx  # → /notifications management
│   │   └── saved.js           # → /profile/company
│   │   └── payment_history.js # → /payment history
│   │   └── my_products.tsx # → /manage my products
│   └── chat/                # ⭐ Chat section
│       ├── _layout.js       # ⭐ Chat layout
│       └── index.js         # → /list my chats
│       └── [companyId].tsx  # → /particular chat
├── (auth)/                  # ⭐ Auth section (no navbar)
│   ├── _layout.js           # ⭐ Auth layout (no navbar)
│   ├── login.js             # → /login
│   └── registration.js      # → /registration
├── _layout.js               # ⭐ Root layout (handles auth state)
└── index.js                 # → / (splash/redirect)

============================

git add .
   git commit -m "Remove native code to use Prebuild"
   eas build --platform android --profile preview

=============================

https://claude.ai/share/ba23905f-588d-444f-a9ad-8912ecbef7ed

=====> for deeplink sharing