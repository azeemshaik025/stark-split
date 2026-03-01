# StarkSplit

> **Split bills in Bitcoin-on-Starknet. Earn yield on STRK. Zero gas fees.**

StarkSplit is a bill-splitting app built on Starknet. Split expenses with friends using a custom Bitcoin-on-Starknet token, settle debts gasless on mainnet. Also includes yield pools where groups can pool STRK and earn rewards through delegation pools.

**[Live Demo](https://stark-split.vercel.app/)** · **[GitHub](https://github.com/azeemshaik025/stark-split)** · **Built with [Starkzap SDK](https://github.com/Starkware-libs/starkzap)**

---

## ⚠️ For Judges & Testers: Get Testing Funds First

**Before testing the app**, connect your wallet and go to **Settings** → **Testnet Faucet** → click **"Get testing funds"**.

You'll receive **0.01 WBTC + 5 STRK** to your connected wallet (one request per address per 24 hours). This is required to:
- **Add expenses** and **settle debts** in split groups (WBTC)
- **Pay gas** on testnet when gasless isn't available (STRK)
- **Contribute** to and **stake** in yield pools (STRK)

Without these funds, you won't be able to create expenses, settle, or use pools.

---

## Features

### ✅ Splits (Custom Token)

- **Create/join groups** via 8-character invite codes or shareable links
- **Add expenses** with auto-calculated splits (equal, custom, percentage)
- **Debt tracking** with real-time balance updates factoring in settlements
- **Gasless settlement** on mainnet (user pays gas on testnet fallback)
- **Social login** via Cartridge (Google, Twitter, passkeys—no seed phrase)
- **Mobile-first UI** with light/dark theme

**Example:** 4 friends split a $120 dinner. One person pays. App auto-calculates that each other person owes $30. Settle with one tap—gasless, instant, on-chain.

### ✅ Yield Pools (STRK)

- **Create pool groups** for group savings goals (trip fund, wedding, shared fund)
- **Pool STRK** from multiple members into a shared on-chain fund
- **Stake automatically** via Starknet delegation pools (admin triggers stake)
- **Live yield tracking** with real-time reward counter
- **Claim rewards** directly to group treasury
- **Proportional distribution** — each member's share is accurate to the second
- **Gasless everything** — all STRK transactions are sponsored

**Example:** 8 friends plan a $12K trip in 3 months. They pool STRK. Admin stakes it. At ~6% APR, the pool earns ~$180 in yield—enough for a shared dinner, earned passively.

### ✅ Shared Features

- **Cartridge Controller** social authentication (no wallet required)
- **Gas sponsorship** on mainnet (custom token) and all networks (STRK)
- **Real-time updates** via Supabase subscriptions
- **Responsive design** optimized for mobile and desktop
- **Light/dark mode** with persistent preference

---

## Architecture

```
                    Starknet (Sepolia/Mainnet)
                    • Custom ERC20 token
                    • STRK token
                    • Delegation pool contract
                    • Cartridge Paymaster
                           ↑
            ┌──────────────┴──────────────┐
            │                             │
        Starkzap SDK                  Supabase
        • connectWallet()             Database
        • transferSTRK()              • users
        • transfer(CustomToken)       • groups
        • stakeGroupFunds()           • expenses
        • claimRewards()              • settlements
                                      • staking_positions
            │                             │
            └──────────────┬──────────────┘
                           │
                    Next.js App
                   (Zustand Store)
```

### State Management (Zustand)

Single store with clear separation:

- **Auth state** — wallet, user, session persistence
- **Splits state** — groups, expenses, debts, settlements
- **Pools state** — pool groups, staking positions, contributions
- **Balance state** — custom token + STRK wallets

---

## Starkzap Integration (All 3 Modules)

### 1. **Wallets — Cartridge Controller**

Social login (Google, Twitter, passkeys) with session keys:

```typescript
const { wallet } = await sdk.onboard({
  strategy: "cartridge",
  cartridge: {
    preset: "controller",
    policies: [
      // Splits
      { target: CUSTOM_TOKEN, method: "transfer" },
      // Pools
      { target: STRK_TOKEN, method: "transfer" },
      { target: STAKING_CONTRACT, method: "enter_delegation_pool" },
      { target: STAKING_CONTRACT, method: "claim_rewards" },
      { target: STAKING_CONTRACT, method: "exit_delegation_pool_intent" },
      { target: STAKING_CONTRACT, method: "exit_delegation_pool_action" },
    ],
  },
  deploy: "if_needed",
});
```

**Why?** Users never see seed phrases, approval popups, or gas fees in the UI. The app feels like a normal web app.

### 2. **Gasless Transactions — Cartridge Paymaster**

All transactions use `feeMode: "sponsored"`:

```typescript
// Splits (custom token)
const tx = await wallet.transfer(
  CUSTOM_TOKEN,
  [
    {
      to: fromAddress(recipientAddress),
      amount: Amount.parse(amount, CUSTOM_TOKEN),
    },
  ],
  { feeMode: "sponsored" },
); // Fallback: "user_pays" on testnet if not whitelisted

// Pools (STRK)
const tx = await wallet.transfer(
  STRK_TOKEN,
  [{ to: fromAddress(poolAddress), amount: Amount.parse(amount, STRK_TOKEN) }],
  { feeMode: "sponsored" },
); // Always sponsored (STRK pre-whitelisted)
```

**Why?** Removing ETH gas fees from the user's mental model makes crypto invisible and adoption possible.

### 3. **Staking — Starknet Delegation Pools**

Group treasury staking with automatic reward accrual:

```typescript
// Enter delegation pool (admin stakes group STRK)
wallet.execute(
  [
    {
      contractAddress: STAKING_CONTRACT,
      entrypoint: "enter_delegation_pool",
      calldata: [wallet.address, amountLow, amountHigh],
    },
  ],
  { feeMode: "sponsored" },
);

// Claim rewards
wallet.execute(
  [
    {
      contractAddress: STAKING_CONTRACT,
      entrypoint: "claim_rewards",
      calldata: [wallet.address],
    },
  ],
  { feeMode: "sponsored" },
);

// Exit (21-day cooldown)
wallet.execute(
  [
    {
      contractAddress: STAKING_CONTRACT,
      entrypoint: "exit_delegation_pool_intent",
      calldata: [amountLow, amountHigh],
    },
  ],
  { feeMode: "sponsored" },
);
```

**Why?** Delegation pools let groups of any size earn yield permissionlessly—no minimum, no validator operation overhead.

---

## Tech Stack

| Layer           | Technology                       | Why                                                        |
| --------------- | -------------------------------- | ---------------------------------------------------------- |
| **Framework**   | Next.js 14+ (App Router)         | Server components, file-based routing, Vercel-native       |
| **Language**    | TypeScript (strict mode)         | Type safety across SDK, Supabase, and components           |
| **Styling**     | Tailwind CSS v4 + CSS variables  | Design token system; light/dark mode; animations           |
| **State**       | Zustand + persist                | Simple, predictable, minimal boilerplate                   |
| **Database**    | Supabase (PostgreSQL + Realtime) | Instant setup, row-level security, real-time subscriptions |
| **Blockchain**  | Starkzap SDK                     | Unified interface for wallets, transfers, staking, gasless |
| **Wallet/Auth** | Cartridge Controller             | Social login, session keys, built-in paymaster             |
| **Gas Sponsor** | Cartridge Paymaster              | Mainnet (custom token + STRK), testnet (STRK only)         |
| **Staking**     | Starknet Delegation Pools        | Permissionless STRK yield (~6% APR)                        |
| **Deployment**  | Vercel                           | Zero-config Next.js hosting                                |

---

## Pages & Routes

### Shared

- `/` — Landing page (how-it-works, trust signals, sign-in CTA)
- `/settings` — User profile, wallet management, display name, **Testnet Faucet** (get 0.01 WBTC + 5 STRK)
- `/join/[code]` — Join group via invite code (routes to split or pool based on type)

### Splits

- `/dashboard` — Split groups overview (net balance, quick-settle shortcuts)
- `/group/[id]` — Group detail (Expenses tab, Balances tab)
- `/group/[id]/add-expense` — Add expense (cash-app-style UI)
- `/group/[id]/settle` — Settle debt (confirmation, gasless badge, settlement status)

### Yield Pools

- `/pools` — Pool overview (list pools, create/join buttons)
- `/yield` — Alternative route to `/pools` for navigation
- `/pool/[id]` — Pool detail (contributions, staking position, yield counter, claim/unstake)

---

## Database Schema

### Core Tables (Splits & Pools)

```sql
-- All users across app
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (discriminated by type)
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '💰',
  type TEXT NOT NULL, -- 'split' | 'pool'
  created_by UUID REFERENCES users(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members (shared for splits & pools)
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
```

### Splits Tables

```sql
-- Expenses in split groups
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  paid_by UUID REFERENCES users(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  split_type TEXT, -- 'equal' | 'exact' | 'percentage'
  split_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settlements (debts paid out)
CREATE TABLE settlements (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  status TEXT, -- 'pending' | 'confirmed' | 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pools Tables

```sql
-- Pool contributions (STRK only)
CREATE TABLE pool_contributions (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staking positions
CREATE TABLE staking_positions (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  validator_address TEXT,
  amount_staked NUMERIC NOT NULL,
  rewards_earned NUMERIC DEFAULT 0,
  status TEXT, -- 'active' | 'exit_pending' | 'exited'
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## How It Works

### Splits Workflow

```
1. User A signs in with Google
   → Cartridge Controller deploys account
   → Zustand persists wallet address

2. Create group "Weekend Dinner"
   → Generate 8-char invite code
   → Share `/join/ab12cd34`

3. Multiple users add expenses
   → Expenses stored in Supabase
   → Debts calculated in a circle (greedy matching algorithm)
   → Example: A→B ($60), B→C ($40), C→A ($20)
   → Minimized to: A→B ($20), B→C ($40)
   → Only 2 transactions needed instead of 3

4. User clicks "Pay" on their debt
   → Routed to settle page
   → Shows amount + gasless badge
   → Wallet.transfer() with feeMode: "sponsored"
   → Settlement stored (confirmed)

5. Return to group
   → Debt updated in real-time
   → Circle recalculates automatically
   → Balance tab shows remaining debts
```

**Key feature:** The circle algorithm minimizes settlements. For N people, maximum N-1 transactions needed to fully settle all debts—no matter how complex the expense history.

### Yield Pools Workflow

```
1. Create pool "Trip Fund 2025"
   → Type: 'pool'
   → Share invite code

2. Members contribute STRK
   → Each tx is gasless (STRK pre-whitelisted)
   → Balance updates in real-time

3. Admin (pool creator) stakes
   → Calls enter_delegation_pool on staking contract
   → Validator auto-selected (Starkzap handles discovery)
   → Position tracked in DB

4. Yield accrues daily (~6% APR)
   → Background job polls staking contract
   → Rewards displayed live in UI
   → Claim button available (admin)

5. Exit (after goal date or by vote)
   → Call exit_delegation_pool_intent
   → 21-day cooldown starts
   → After cooldown: exit_delegation_pool_action
   → STRK distributed proportionally to members
```

---

## Key Implementation Details

### Debt Calculation

Uses greedy matching (minimum cashflow algorithm) to minimize settlement transactions:

- N people in a group → max N-1 transactions to fully settle
- Settlements factored into live debt display (no stale "you owe" after paying)
- Example: 4 people with complex debts → only 2 transactions needed

### Gas Sponsorship Strategy

- **Mainnet** — Custom token: sponsored (whitelisted). STRK: always sponsored.
- **Sepolia testnet** — STRK: always sponsored. Custom token: attempts sponsored, fallbacks to user-pays with "Fee will be deducted (testnet only)" message.

### Real-Time Updates

- Supabase Realtime subscriptions for group changes (expenses, members, settlements)
- Zustand store triggers UI updates instantly
- No polling—event-driven architecture

### Token Strategy

- **Splits** — Custom ERC20 token (Bitcoin-on-Starknet on testnet; official WBTC bridge on mainnet)
- **Pools** — STRK only (staking token native to Starknet)
- Single currency per flow = simple UX, no multi-token debt math

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/azeemshaik025/stark-split.git
cd stark-split

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Starknet
NEXT_PUBLIC_STARKNET_NETWORK=sepolia        # sepolia or mainnet
NEXT_PUBLIC_STAKING_CONTRACT=0x00ca...      # Delegation pool contract

# Custom Token (Splits)
NEXT_PUBLIC_CUSTOM_TOKEN_ADDRESS=0x...      # Your ERC20 token
NEXT_PUBLIC_CUSTOM_TOKEN_DECIMALS=8         # Token decimals (WBTC)
NEXT_PUBLIC_CUSTOM_TOKEN_SYMBOL=WBTC        # Display symbol

# Faucet (server-only, for Settings "Get testing funds" — sends 0.01 WBTC + 5 STRK)
# FAUCET_PRIVATE_KEY=0x...
# FAUCET_PUBLIC_KEY=0x...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Testnet Demo Notes

For testing on **Sepolia testnet**, we've deployed a custom WBTC token. **Judges and testers must first get testing funds** from **Settings → Testnet Faucet** (click "Get testing funds"). You'll receive **0.01 WBTC + 5 STRK** to your connected wallet—one request per address per 24 hours. This enables:

- Adding expenses and settling debts in split groups (WBTC)
- Paying gas on testnet when gasless isn't available (STRK)
- Contributing to and staking in yield pools (STRK)

Without these funds, the app won't be usable for testing.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm run start
```

---

## Real-World Use Cases

### 🎫 Group Trip

8 friends pool $12,000 three months before a trip. At ~6% APR, the treasury earns ~$180 in yield—enough for a shared group dinner, earned passively. Expenses logged in real-time. Settled from pool at checkout.

### 🏠 Roommates

4 roommates split rent, utilities, and groceries monthly. Instead of one person floating cash and chasing others for reimbursement, the STRK pool handles it. Yield offsets a month's groceries over a year.

### 🚀 Startup Expense Reimbursement

10 remote employees floating ~$500/month each in expenses. The $5,000 monthly float earns ~$300/year in yield on money that's already committed. Gasless settlements eliminate the friction of manual reimbursement requests.

---

## Starkzap Issues

During development of StarkSplit, we identified key enhancement opportunities in the Starkzap SDK:

### Issue #49: Gas Sponsorship Fallback Standardization

- **Status:** ✅ Already filed by community
- **Link:** [github.com/keep-starknet-strange/starkzap/issues/49](https://github.com/keep-starknet-strange/starkzap/issues/49)
- **Context:** When `feeMode: "sponsored"` fails on testnet, there's no standard error handling pattern. This affects all custom token integrations.

---

## License

MIT — Built for the Starkzap Developer Challenge.

---

## Contact & Links

- **Live Demo** — [stark-split.vercel.app](https://stark-split.vercel.app/)
- **GitHub** — [github.com/azeemshaik025/stark-split](https://github.com/azeemshaik025/stark-split)
- **Twitter** — [@[handle]](https://twitter.com)

Built with ❤️ using **[Starkzap SDK](https://github.com/Starkware-libs/starkzap)** on **Starknet**.
