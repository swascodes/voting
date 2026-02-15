# Lace Preview Wallet Setup Guide

This voting frontend integrates with **Lace Preview Wallet** using the native wallet API.

## Installation

### Chrome Extension

1. **Install Lace Wallet**
   - [Chrome Web Store](https://chromewebstore.google.com/detail/lace/gafhdigitgjmp7g7)
   - Or search "Lace" in Chrome extensions

2. **Verify Extension is Enabled**
   - Go to `chrome://extensions`
   - Search for "Lace"
   - Ensure the toggle is **ON**
   - Note the Extension ID: `hgeekaiplokcnmakghbdfbgnlfheichg`

### Wallet Setup

1. Open the Lace extension icon in your browser toolbar
2. Create or import a wallet
3. **Important**: Select **Preview network** (not Mainnet)
4. Fund your wallet if needed
5. Keep the wallet unlocked while using the dApp

## Using the Voting Frontend

### Connect Your Wallet

1. Open the voting dApp: `http://localhost:5173`
2. Click **"Connect Lace Wallet"**
3. The frontend will automatically detect and connect to your Lace wallet
4. Your wallet address will be securely stored locally

### Vote

Once connected:
1. (Admin) Click **"Open Voting"** to enable voting
2. Enter a candidate name
3. Click **"Cast Vote"**
4. Confirm in the Lace wallet if prompted
5. Vote is submitted to the network

### Close Voting

1. (Admin) Click **"Close Voting"** when voting period ends

## How It Works

The frontend uses native wallet API:

```
Click "Connect Lace Wallet"
    ↓
Frontend detects window.cardano.lace
    ↓
Retrieves addresses from connected wallet
    ↓
Stores address locally
    ↓
Ready to vote!
```

**No manual copy/paste** — Full integration with Lace wallet extension.

## Network Configuration

Make sure your Lace wallet is on the **Preview network**:

1. Open Lace wallet
2. Look for network selector (usually in settings)
3. Select **Preview** network
4. The dApp expects contract to be on Preview

## Wallet API Support

The frontend supports:

✅ **CIP-30 Standard** — Modern wallet popup flow  
✅ **Unshielded Mode** — Direct address access  
✅ **Address Retrieval** — Get used addresses  
✅ **Transaction Signing** — Via wallet extension  

## Troubleshooting

### "Lace Preview wallet not found"

**Solution:**
1. Verify Lace is installed: `chrome://extensions`
2. Enable the toggle if it's off
3. Reload the dApp page (F5)
4. Check browser console for errors (F12)

### Extension not injecting into window.cardano

**Solution:**
1. Lace might not be enabled on this site
2. Click Lace icon → check permissions
3. Refresh the page
4. Clear browser cache if needed

### Wallet shows but no addresses found

**Solution:**
1. Unlock your Lace wallet extension
2. Ensure you're on Preview network
3. Refresh the dApp
4. Try clicking "Connect Wallet" again

### Transactions fail

**Solution:**
1. Verify enough funds in wallet
2. Ensure Preview network is selected in Lace
3. Check that Midnight network endpoint is reachable
4. Review error message in browser console (F12)

## Extension ID

For reference or troubleshooting:
- **Chrome Extension ID**: `hgeekaiplokcnmakghbdfbgnlfheichg`
- **Install Link**: https://chromewebstore.google.com/detail/lace/gafhdigitgjmp7g7

## Security Notes

✅ **No Private Keys On Frontend** — All signing happens in Lace wallet  
✅ **No Seed Phrase Needed** — dApp never sees your seed  
✅ **Secure Connection** — CIP-30 standard communication  
✅ **Local Storage** — Only address is stored (no keys)  

## Support

If issues persist:
1. Check the browser console: `F12` → Console tab
2. Read the error message carefully
3. Verify Lace is unlocked and on Preview network
4. Try disabling other wallet extensions (may conflict)
5. Restart browser if needed

