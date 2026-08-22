<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0d591f83-33d7-4bb6-995c-c49f0489cb5f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Zibal Payment Gateway & Vercel Deployment

If you are deploying this project on **Vercel** or any non-Iranian server, the server will not be able to connect to the Zibal payment gateway due to Zibal's regional network restrictions (IP blocking).

To solve this, the project uses a proxy system:
1. The file `public/zibal-proxy.php` is provided as a secure proxy script.
2. **Do not run this script on Vercel.** You must host `zibal-proxy.php` on a separate PHP server located inside Iran (e.g., a simple cPanel/DirectAdmin host).
3. The proxy requires a configuration file named `proxy-config.php` placed one directory above `zibal-proxy.php` containing your proxy secret:
   ```php
   <?php
   return [
       'PAYMENT_PROXY_SECRET_KEY' => 'YOUR_SECRET_KEY'
   ];
   ```
4. Set the following environment variables in your Vercel project settings:
   - `PAYMENT_PROXY_URL`: The full URL to your hosted proxy (e.g., `https://your-iran-domain.ir/zibal-proxy.php`).
   - `PAYMENT_PROXY_SECRET_KEY`: The same secret key you placed in `proxy-config.php`.
   - `ZIBAL_MERCHANT_ID`: Your Zibal Merchant ID.

The Express backend will automatically route all Zibal requests through your hosted proxy securely.
