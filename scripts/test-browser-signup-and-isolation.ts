import puppeteer, { Browser, Page } from 'puppeteer-core';
import { prisma } from '../src/lib/prisma';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function runBrowserTests() {
  console.log('🚀 Starting Chrome Browser Headless QA for Signup & Account Isolation...');

  const ts = Date.now();
  const testEmail = `divya.${ts}@vibemiles-qa.internal`;
  const testPhone = `+9198765${String(ts).slice(-5)}`;
  const testName = 'Divya Krishnan';
  const testPassword = 'Password123!';

  const browser: Browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page: Page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // ── STEP 1: Test Login Page Initial State ──
    console.log('\n[Step 1] Navigating to /login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    const emailValue = await page.$eval('input[type="email"]', (el) => (el as HTMLInputElement).value);
    const passwordValue = await page.$eval('input[type="password"]', (el) => (el as HTMLInputElement).value);

    console.log(`- Login Email field value: "${emailValue}"`);
    console.log(`- Login Password field value: "${passwordValue}"`);

    if (emailValue.includes('rahul.sharma') || emailValue.length > 0) {
      throw new Error(`FAIL: Login page prefilled unexpected email: "${emailValue}"`);
    }
    if (passwordValue.length > 0) {
      throw new Error(`FAIL: Login page prefilled password!`);
    }
    console.log('✅ STEP 1 PASS: Login page contains empty initial fields without demo credentials.');

    // ── STEP 2: Test User Registration Flow ──
    console.log('\n[Step 2] Navigating to /register to test Sign Up...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });

    // Fill form
    await page.type('input[placeholder="John Doe"]', testName);
    await page.type('input[type="email"]', testEmail);
    await page.type('input[placeholder="+91 98765 43210"]', testPhone);
    await page.type('input[type="password"]', testPassword);

    console.log(`- Submitting registration for: ${testName} (${testEmail})...`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);

    const currentUrl = page.url();
    console.log(`- Post-registration URL: ${currentUrl}`);
    if (!currentUrl.includes('/account/dashboard')) {
      throw new Error(`FAIL: Expected redirect to /account/dashboard, got: ${currentUrl}`);
    }

    // Inspect welcome message
    await page.waitForSelector('h1');
    const welcomeText = await page.$eval('h1', (el) => el.textContent || '');
    console.log(`- Dashboard Welcome Heading: "${welcomeText}"`);
    if (!welcomeText.includes('Divya')) {
      throw new Error(`FAIL: Dashboard heading does not contain user name! Got: "${welcomeText}"`);
    }
    if (welcomeText.includes('Rahul')) {
      throw new Error(`FAIL: Dashboard heading leaked Rahul Sharma! Got: "${welcomeText}"`);
    }
    console.log('✅ STEP 2 PASS: Registered and redirected to dashboard with personalized user greeting.');

    // ── STEP 3: Verify AccountSidebar Details ──
    console.log('\n[Step 3] Verifying AccountSidebar display values...');
    const sidebarText = await page.$eval('aside', (el) => el.textContent || '');
    if (!sidebarText.includes('Divya Krishnan') || !sidebarText.includes(testEmail)) {
      throw new Error(`FAIL: Sidebar does not display registered user! Got: "${sidebarText.slice(0, 150)}"`);
    }
    if (sidebarText.includes('rahul.sharma@example.com')) {
      throw new Error('FAIL: Sidebar leaked rahul.sharma@example.com!');
    }
    console.log('✅ STEP 3 PASS: AccountSidebar displays real registered name & email.');

    // ── STEP 4: Navigate to Public Home Page & Check PublicHeader ──
    console.log('\n[Step 4] Navigating to Home page (/) to verify PublicHeader shows logged-in state...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

    // Check if "Sign In" button exists in header
    const headerButtons = await page.$$eval('header button, header a', (elements) =>
      elements.map((el) => el.textContent?.trim() || '')
    );
    console.log(`- Header action items:`, headerButtons.filter((b) => b.length > 0));

    const hasSignInButton = headerButtons.some((b) => b === 'Sign In');
    const hasUserInitialOrName = headerButtons.some((b) => b.includes('Divya') || b === 'D');

    if (hasSignInButton) {
      throw new Error('FAIL: PublicHeader STILL shows "Sign In" button for an authenticated user!');
    }
    if (!hasUserInitialOrName) {
      throw new Error('FAIL: PublicHeader does not show user profile dropdown/avatar for Divya!');
    }
    console.log('✅ STEP 4 PASS: PublicHeader dynamically displays logged-in user profile, "Sign In" button is gone!');

    // ── STEP 5: Verify Account Profile Page ──
    console.log('\n[Step 5] Navigating to /account/profile to verify form binding...');
    await page.goto(`${BASE_URL}/account/profile`, { waitUntil: 'networkidle2' });

    const profileName = await page.$eval('input[required]', (el) => (el as HTMLInputElement).value);
    const profileEmail = await page.$eval('input[type="email"]', (el) => (el as HTMLInputElement).value);

    console.log(`- Profile Form Name: "${profileName}"`);
    console.log(`- Profile Form Email: "${profileEmail}"`);

    if (profileName !== testName) {
      throw new Error(`FAIL: Profile form name expected "${testName}", got: "${profileName}"`);
    }
    if (profileEmail !== testEmail) {
      throw new Error(`FAIL: Profile form email expected "${testEmail}", got: "${profileEmail}"`);
    }
    console.log('✅ STEP 5 PASS: Profile page properly binds to authenticated user instead of hardcoded data.');

    // ── STEP 6: Test Sign Out ──
    console.log('\n[Step 6] Testing Sign Out from AccountSidebar...');
    const signOutBtn = await page.$('aside button');
    if (!signOutBtn) throw new Error('Sign out button not found in sidebar!');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      signOutBtn.click(),
    ]);

    const postLogoutUrl = page.url();
    console.log(`- Post-logout URL: ${postLogoutUrl}`);

    // Verify PublicHeader now displays "Sign In" again
    await page.waitForSelector('header');
    const postLogoutHeaderButtons = await page.$$eval('header button, header a', (elements) =>
      elements.map((el) => el.textContent?.trim() || '')
    );
    const hasSignInAgain = postLogoutHeaderButtons.some((b) => b === 'Sign In');
    if (!hasSignInAgain) {
      throw new Error('FAIL: Header does not show "Sign In" button after logout!');
    }
    console.log('✅ STEP 6 PASS: Sign Out successful; session cleared, PublicHeader restored to Sign In.');

    // ── STEP 7: Check Partner Login Initial State ──
    console.log('\n[Step 7] Navigating to /partner/login to verify partner login initial state...');
    await page.goto(`${BASE_URL}/partner/login`, { waitUntil: 'networkidle2' });

    const partnerEmailValue = await page.$eval('input[type="email"]', (el) => (el as HTMLInputElement).value);
    const partnerPasswordValue = await page.$eval('input[type="password"]', (el) => (el as HTMLInputElement).value);

    console.log(`- Partner Email field value: "${partnerEmailValue}"`);
    console.log(`- Partner Password field value: "${partnerPasswordValue}"`);

    if (partnerEmailValue.includes('partner@travelhub.com') || partnerEmailValue.length > 0) {
      throw new Error(`FAIL: Partner login prefilled: "${partnerEmailValue}"`);
    }
    if (partnerPasswordValue.length > 0) {
      throw new Error('FAIL: Partner login prefilled password!');
    }
    console.log('✅ STEP 7 PASS: Partner login contains empty initial state without demo credentials.');

    console.log('\n======================================================');
    console.log('🎉 ALL BROWSER-BASED SIGNUP & ISOLATION QA TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();

    // Clean up test user created in DB
    console.log('🧹 Cleaning up browser test user from database...');
    const testUser = await prisma.user.findFirst({
      where: { email: testEmail },
    });
    if (testUser) {
      await prisma.session.deleteMany({ where: { userId: testUser.id } });
      await prisma.customerProfile.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('✅ Browser test user cleanly removed.');
    }
    await prisma.$disconnect();
  }
}

runBrowserTests().catch((err) => {
  console.error('❌ Browser QA failed:', err);
  process.exit(1);
});
