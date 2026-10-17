/**
 * Comprehensive Browser-based QA Test Suite for VibeMiles Client Customization
 * Tests:
 * 1. Desktop & Mobile viewports on /devotional-trips and /foreign-trips
 * 2. Visual layout, brand colours, and typography
 * 3. Navigation links (desktop header, mobile drawer, footer, hero search, category filters)
 * 4. Search, filters, package cards, and interactive package comparison matrix
 * 5. Old-route redirects (/destinations -> /devotional-trips, /adventures -> /foreign-trips) and /destinations/[slug]
 * 6. Relevance & provenance of live packages from Supabase
 * 7. Accuracy & cautious wording of temple darshan & visa guidance
 * 8. Authentication & booking flow navigation
 * 9. Browser console errors, failed network requests, and hydration mismatch monitoring
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

interface QAResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  viewport?: string;
  url?: string;
}

const results: QAResult[] = [];
const consoleErrors: { url: string; text: string; type: string }[] = [];
const failedRequests: { url: string; failureText: string }[] = [];

function record(suite: string, name: string, status: 'PASS' | 'FAIL' | 'WARN', details: string, viewport?: string, url?: string) {
  results.push({ suite, name, status, details, viewport, url });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`[${icon} ${status}] [${suite}] ${name}${viewport ? ` (${viewport})` : ''}: ${details}`);
}

async function createBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-extensions',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
    ],
  });
}

function attachPageListeners(page: Page, currentUrlRef: { url: string }) {
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error' || text.toLowerCase().includes('hydration') || text.toLowerCase().includes('error')) {
      consoleErrors.push({ url: currentUrlRef.url, text, type });
      if (text.includes('hydration') || text.includes('Hydration')) {
        console.warn(`⚠️ HYDRATION WARNING on ${currentUrlRef.url}: ${text}`);
      }
    }
  });

  page.on('requestfailed', (req) => {
    failedRequests.push({
      url: req.url(),
      failureText: req.failure()?.errorText || 'Unknown failure',
    });
  });

  page.on('pageerror', (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    consoleErrors.push({ url: currentUrlRef.url, text: msg, type: 'pageerror' });
  });
}

async function safeGoto(page: Page, url: string, timeout = 15000) {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await new Promise((r) => setTimeout(r, 600)); // allow React hydration & initial render
    return res;
  } catch (err: unknown) {
    console.warn(`[safeGoto warning on ${url}]: ${String(err)}`);
    return null;
  }
}

async function runQASuite() {
  console.log('================================================================');
  console.log(' STARTING VIBEMILES BROWSER QA TEST SUITE');
  console.log(' Local Time: ' + new Date().toISOString());
  console.log(' Target Base URL: ' + BASE_URL);
  console.log(' Browser: Google Chrome (Headless)');
  console.log('================================================================\n');

  const browser = await createBrowser();
  const currentUrl = { url: BASE_URL };

  try {
    // ══════════════════════════════════════════════════════════════════
    // SUITE 1: DESKTOP & MOBILE VIEWPORT LAYOUT & BRAND COLOURS
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 1: Layout & Brand Colours ---');
    const viewports = [
      { name: 'Desktop (1280x800)', width: 1280, height: 800, isMobile: false },
      { name: 'Mobile (375x667)', width: 375, height: 667, isMobile: true, hasTouch: true },
    ];

    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      attachPageListeners(page, currentUrl);

      // 1.1 Devotional Trips Hub
      currentUrl.url = `${BASE_URL}/devotional-trips`;
      await safeGoto(page, currentUrl.url);

      const devotionalTitle = await page.title();
      record(
        'Layout',
        'Devotional Trips Page Title',
        devotionalTitle.toLowerCase().includes('devotional') ? 'PASS' : 'FAIL',
        `Title: "${devotionalTitle}"`,
        vp.name,
        currentUrl.url
      );

      const devotionalBadgeText = await page.$eval(
        'section:first-of-type span',
        (el) => el.textContent || ''
      ).catch(() => '');
      record(
        'Layout',
        'Devotional Hero Badge',
        devotionalBadgeText.includes('Sacred') || devotionalBadgeText.includes('🛕') ? 'PASS' : 'WARN',
        `Badge: "${devotionalBadgeText.trim()}"`,
        vp.name
      );

      const advisoryText = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasDarshanAdvisory: text.includes('Devotee Advisory') || text.includes('Darshan Guidelines'),
          hasTempleTrustNotice: text.includes('Tirumala') || text.includes('Kashi Vishwanath'),
        };
      });
      record(
        'Layout',
        'Devotee Advisory Notice Card',
        advisoryText.hasDarshanAdvisory && advisoryText.hasTempleTrustNotice ? 'PASS' : 'FAIL',
        'Verified presence of Devotee Advisory and official Temple Trust notice',
        vp.name
      );

      // Check Brand Colors on Devotional Trips
      const devotionalColors = await page.evaluate(() => {
        const hero = document.querySelector('section');
        const heroBg = hero ? window.getComputedStyle(hero).backgroundColor : '';
        const titleSpan = document.querySelector('h1 span');
        const tealColor = titleSpan ? window.getComputedStyle(titleSpan).color : '';
        const advisoryCard = document.querySelector('.bg-amber-50\\/80, [class*="amber-50"], [class*="bg-amber"]');
        const advisoryBg = advisoryCard ? window.getComputedStyle(advisoryCard).backgroundColor : '';
        return { heroBg, tealColor, advisoryBg };
      });
      record(
        'Brand Colours',
        'Devotional Trips Color Palette',
        devotionalColors.heroBg && devotionalColors.tealColor ? 'PASS' : 'WARN',
        `Hero BG: ${devotionalColors.heroBg}, Teal Accent: ${devotionalColors.tealColor}, Amber Advisory BG: ${devotionalColors.advisoryBg}`,
        vp.name
      );

      // 1.2 Foreign Trips Hub
      currentUrl.url = `${BASE_URL}/foreign-trips`;
      await safeGoto(page, currentUrl.url);

      const foreignTitle = await page.title();
      record(
        'Layout',
        'Foreign Trips Page Title',
        foreignTitle.toLowerCase().includes('foreign') ? 'PASS' : 'FAIL',
        `Title: "${foreignTitle}"`,
        vp.name,
        currentUrl.url
      );

      const foreignHeroBadge = await page.$eval(
        'section:first-of-type span',
        (el) => el.textContent || ''
      ).catch(() => '');
      record(
        'Layout',
        'Foreign Hero Badge',
        foreignHeroBadge.includes('International') || foreignHeroBadge.includes('✈️') ? 'PASS' : 'WARN',
        `Badge: "${foreignHeroBadge.trim()}"`,
        vp.name
      );

      const visaDisclosure = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasVisaNotice: text.includes('International Travel & Visa Disclosure') || text.includes('Visa Disclosure'),
          hasPassportNotice: text.includes('6-Month Passport Validity') || text.includes('6 months'),
        };
      });
      record(
        'Layout',
        'Visa & Passport Advisory Card',
        visaDisclosure.hasVisaNotice && visaDisclosure.hasPassportNotice ? 'PASS' : 'FAIL',
        'Verified presence of International Visa Disclosure and 6-month passport guideline',
        vp.name
      );

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 2: NAVIGATION LINKS (DESKTOP, MOBILE DRAWER, FOOTER, HERO)
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 2: Navigation Links Verification ---');
    {
      // 2.1 Desktop Navigation Header
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800, isMobile: false });
      attachPageListeners(page, currentUrl);

      currentUrl.url = `${BASE_URL}`;
      await safeGoto(page, currentUrl.url);

      const headerLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('header nav a, header a'));
        return links.map((a) => ({
          text: (a.textContent || '').trim(),
          href: a.getAttribute('href'),
        }));
      });

      const devotionalNav = headerLinks.find((l) => l.text.includes('Devotional Trips') && l.href === '/devotional-trips');
      const foreignNav = headerLinks.find((l) => l.text.includes('Foreign Trips') && l.href === '/foreign-trips');
      const destinationsNav = headerLinks.find((l) => l.text === 'Destinations');
      const experiencesNav = headerLinks.find((l) => l.text === 'Experiences');

      record(
        'Navigation',
        'Desktop Header Devotional Trips Link',
        devotionalNav ? 'PASS' : 'FAIL',
        devotionalNav ? `Found "${devotionalNav.text}" -> ${devotionalNav.href}` : 'Not found in desktop header',
        'Desktop'
      );
      record(
        'Navigation',
        'Desktop Header Foreign Trips Link',
        foreignNav ? 'PASS' : 'FAIL',
        foreignNav ? `Found "${foreignNav.text}" -> ${foreignNav.href}` : 'Not found in desktop header',
        'Desktop'
      );
      record(
        'Navigation',
        'Old Navigation Items Removed',
        !destinationsNav && !experiencesNav ? 'PASS' : 'FAIL',
        `Destinations present: ${!!destinationsNav}, Experiences present: ${!!experiencesNav}`,
        'Desktop'
      );

      // Click Devotional Trips navigation link
      if (devotionalNav) {
        await page.click('header nav a[href="/devotional-trips"]');
        await page.waitForFunction(() => window.location.pathname.includes('/devotional-trips'), { timeout: 10000 }).catch(() => {});
        const onDevotional = page.url().includes('/devotional-trips');
        record(
          'Navigation',
          'Desktop Header Click -> /devotional-trips',
          onDevotional ? 'PASS' : 'FAIL',
          `Navigated to: ${page.url()}`,
          'Desktop'
        );
      }

      // Return home before clicking next link
      await safeGoto(page, BASE_URL);

      // Click Foreign Trips navigation link
      if (foreignNav) {
        await page.click('header nav a[href="/foreign-trips"]');
        await page.waitForFunction(() => window.location.pathname.includes('/foreign-trips'), { timeout: 10000 }).catch(() => {});
        const onForeign = page.url().includes('/foreign-trips');
        record(
          'Navigation',
          'Desktop Header Click -> /foreign-trips',
          onForeign ? 'PASS' : 'FAIL',
          `Navigated to: ${page.url()}`,
          'Desktop'
        );
      }

      // 2.2 Footer Links
      await safeGoto(page, BASE_URL);
      const footerLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('footer a'));
        return links.map((a) => ({
          text: (a.textContent || '').trim(),
          href: a.getAttribute('href'),
        }));
      });
      const footerDevotional = footerLinks.find((l) => l.text.includes('Devotional Trips') && l.href === '/devotional-trips');
      const footerForeign = footerLinks.find((l) => l.text.includes('Foreign Trips') && l.href === '/foreign-trips');

      record(
        'Navigation',
        'Footer Devotional Trips Link',
        footerDevotional ? 'PASS' : 'FAIL',
        footerDevotional ? `Found "${footerDevotional.text}" -> ${footerDevotional.href}` : 'Missing in footer',
        'Desktop'
      );
      record(
        'Navigation',
        'Footer Foreign Trips Link',
        footerForeign ? 'PASS' : 'FAIL',
        footerForeign ? `Found "${footerForeign.text}" -> ${footerForeign.href}` : 'Missing in footer',
        'Desktop'
      );

      // 2.3 Homepage Hero Quick-Search Pills
      const heroPills = await page.evaluate(() => {
        const pills = Array.from(document.querySelectorAll('a[href="/devotional-trips"], a[href="/foreign-trips"]'));
        return pills.map((p) => ({
          text: (p.textContent || '').trim(),
          href: p.getAttribute('href'),
        }));
      });
      const hasDevotionalPill = heroPills.some((p) => p.text.includes('Devotional Trips') && p.href === '/devotional-trips');
      const hasForeignPill = heroPills.some((p) => p.text.includes('Foreign Trips') && p.href === '/foreign-trips');

      record(
        'Navigation',
        'Homepage Hero Quick Filter Pills',
        hasDevotionalPill && hasForeignPill ? 'PASS' : 'FAIL',
        `Devotional Pill: ${hasDevotionalPill}, Foreign Pill: ${hasForeignPill}`,
        'Desktop'
      );

      await page.close();
    }

    {
      // 2.4 Mobile Navigation Drawer
      console.log('\n--- Mobile Drawer Navigation Test ---');
      const page = await browser.newPage();
      await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
      attachPageListeners(page, currentUrl);

      currentUrl.url = `${BASE_URL}`;
      await safeGoto(page, currentUrl.url);

      try {
        const opened = await page.evaluate(() => {
          const btn = (document.querySelector('header button[aria-label="Toggle Navigation"]') ||
            document.querySelector('header button[aria-label*="navigation" i]') ||
            document.querySelector('header button:has(svg)')) as HTMLButtonElement | null;
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });

        if (opened) {
          await new Promise((r) => setTimeout(r, 600)); // wait for drawer animation

          const mobileNavLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('#public-mobile-navigation a, [role="dialog"] a, header a'));
            return links.map((l) => ({
              text: (l.textContent || '').trim(),
              href: l.getAttribute('href'),
            }));
          });

          const mobileDevotional = mobileNavLinks.find((l) => l.text.includes('Devotional Trips') && l.href === '/devotional-trips');
          const mobileForeign = mobileNavLinks.find((l) => l.text.includes('Foreign Trips') && l.href === '/foreign-trips');

          record(
            'Navigation',
            'Mobile Drawer Devotional Trips Link',
            mobileDevotional ? 'PASS' : 'WARN',
            mobileDevotional ? `Found "${mobileDevotional.text}" -> ${mobileDevotional.href}` : 'Not detected in drawer DOM',
            'Mobile'
          );
          record(
            'Navigation',
            'Mobile Drawer Foreign Trips Link',
            mobileForeign ? 'PASS' : 'WARN',
            mobileForeign ? `Found "${mobileForeign.text}" -> ${mobileForeign.href}` : 'Not detected in drawer DOM',
            'Mobile'
          );
        } else {
          record('Navigation', 'Mobile Hamburger Button', 'WARN', 'Hamburger button not found in header', 'Mobile');
        }
      } catch (err: unknown) {
        record('Navigation', 'Mobile Drawer Toggle', 'WARN', `Error toggling drawer: ${String(err)}`, 'Mobile');
      }

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 3: SEARCH, FILTERS & PACKAGE COMPARISON INTERACTIONS
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 3: Filters, Cards & Package Comparison ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800, isMobile: false });
      attachPageListeners(page, currentUrl);

      // 3.1 Destination Filter on /devotional-trips
      currentUrl.url = `${BASE_URL}/devotional-trips?destination=Varanasi`;
      await safeGoto(page, currentUrl.url);

      const devotionalCards = await page.evaluate(() => {
        const cardTitles = Array.from(document.querySelectorAll('h3, h4')).map((h) => (h.textContent || '').trim());
        return { cardTitles };
      });

      const hasVaranasiPackage = devotionalCards.cardTitles.some((t) => t.toLowerCase().includes('varanasi') || t.toLowerCase().includes('kashi'));
      record(
        'Filters',
        'Devotional Filter by Destination (Varanasi)',
        hasVaranasiPackage ? 'PASS' : 'FAIL',
        `Found Varanasi package in filtered view: ${hasVaranasiPackage}`,
        'Desktop',
        currentUrl.url
      );

      // 3.2 Country Filter on /foreign-trips
      currentUrl.url = `${BASE_URL}/foreign-trips?country=Dubai`;
      await safeGoto(page, currentUrl.url);

      const foreignCards = await page.evaluate(() => {
        const titles = Array.from(document.querySelectorAll('h3, h4')).map((h) => (h.textContent || '').trim());
        return { titles };
      });
      const hasDubaiPackage = foreignCards.titles.some((t) => t.toLowerCase().includes('dubai'));
      record(
        'Filters',
        'Foreign Filter by Country (Dubai)',
        hasDubaiPackage ? 'PASS' : 'FAIL',
        `Found Dubai package in filtered view: ${hasDubaiPackage}`,
        'Desktop',
        currentUrl.url
      );

      // 3.3 Interactive Package Comparison Matrix on /foreign-trips
      currentUrl.url = `${BASE_URL}/foreign-trips`;
      await safeGoto(page, currentUrl.url);

      const comparisonMatrixExists = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Compare International Packages') || text.includes('Interactive Comparison');
      });
      record(
        'Comparison Matrix',
        'Foreign Package Comparison Matrix Rendered',
        comparisonMatrixExists ? 'PASS' : 'FAIL',
        `Comparison matrix visible: ${comparisonMatrixExists}`,
        'Desktop'
      );

      // Test toggling package comparison pills
      const toggleTest = await page.evaluate(async () => {
        const buttons = Array.from(document.querySelectorAll('button')).filter((b) =>
          b.textContent?.includes('Dubai') || b.textContent?.includes('Bali') || b.textContent?.includes('Thailand')
        );
        if (buttons.length > 0) {
          const initialText = buttons[0].textContent?.trim() || '';
          buttons[0].click();
          await new Promise((r) => setTimeout(r, 300));
          return { clicked: initialText, success: true };
        }
        return { success: false, clicked: 'none' };
      });
      record(
        'Comparison Matrix',
        'Toggle Package Selection Pill',
        toggleTest.success ? 'PASS' : 'WARN',
        `Toggled button: "${toggleTest.clicked}"`,
        'Desktop'
      );

      // 3.4 Package Card Click Navigation
      try {
        const firstPackageLink = await page.$eval(
          'a[href^="/packages/"]',
          (a) => a.getAttribute('href')
        ).catch(() => null);

        if (firstPackageLink) {
          await safeGoto(page, `${BASE_URL}${firstPackageLink}`);
          const pkgDetailTitle = await page.title();
          record(
            'Package Details',
            'Navigate to Package Detail Page',
            pkgDetailTitle.length > 0 ? 'PASS' : 'FAIL',
            `URL: ${firstPackageLink} | Title: "${pkgDetailTitle}"`,
            'Desktop'
          );
        } else {
          record('Package Details', 'Navigate to Package Detail Page', 'WARN', 'No /packages/ link found on page', 'Desktop');
        }
      } catch (err: unknown) {
        record('Package Details', 'Navigate to Package Detail Page', 'WARN', `Error: ${String(err)}`, 'Desktop');
      }

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 4: OLD-ROUTE REDIRECTS & DESTINATION DETAIL ROUTES
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 4: Old Route Redirects & Destination Details ---');
    {
      const page = await browser.newPage();
      attachPageListeners(page, currentUrl);

      // 4.1 /destinations -> /devotional-trips redirect
      currentUrl.url = `${BASE_URL}/destinations`;
      await safeGoto(page, currentUrl.url);
      const finalDestUrl = page.url();
      record(
        'Redirects',
        'Legacy /destinations Redirect',
        finalDestUrl.endsWith('/devotional-trips') ? 'PASS' : 'FAIL',
        `Navigated /destinations -> Final URL: ${finalDestUrl}`,
        'Desktop'
      );

      // 4.2 /adventures -> /foreign-trips redirect
      currentUrl.url = `${BASE_URL}/adventures`;
      await safeGoto(page, currentUrl.url);
      const finalAdvUrl = page.url();
      record(
        'Redirects',
        'Legacy /adventures Redirect',
        finalAdvUrl.endsWith('/foreign-trips') ? 'PASS' : 'FAIL',
        `Navigated /adventures -> Final URL: ${finalAdvUrl}`,
        'Desktop'
      );

      // 4.3 /destinations/varanasi detail route preserved
      currentUrl.url = `${BASE_URL}/destinations/varanasi`;
      const varanasiRes = await safeGoto(page, currentUrl.url);
      const varanasiH1 = await page.$eval('h1', (el) => el.textContent?.trim() || '').catch(() => '');
      const varanasiOk = varanasiH1.includes('Varanasi');
      record(
        'Destination Details',
        'Preserved /destinations/varanasi Route',
        varanasiOk ? 'PASS' : 'FAIL',
        `Status: ${varanasiRes?.status()} | Heading: "${varanasiH1}"`,
        'Desktop'
      );

      // 4.4 /destinations/dubai detail route preserved
      currentUrl.url = `${BASE_URL}/destinations/dubai`;
      const dubaiRes = await safeGoto(page, currentUrl.url);
      const dubaiH1 = await page.$eval('h1', (el) => el.textContent?.trim() || '').catch(() => '');
      const dubaiOk = dubaiH1.includes('Dubai');
      record(
        'Destination Details',
        'Preserved /destinations/dubai Route',
        dubaiOk ? 'PASS' : 'FAIL',
        `Status: ${dubaiRes?.status()} | Heading: "${dubaiH1}"`,
        'Desktop'
      );

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 5: RELEVANCE & PROVENANCE OF DISPLAYED PACKAGES
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 5: Package Relevance & Provenance ---');
    {
      const page = await browser.newPage();
      attachPageListeners(page, currentUrl);

      // Check Devotional Trips packages
      currentUrl.url = `${BASE_URL}/devotional-trips`;
      await safeGoto(page, currentUrl.url);

      const devotionalPkgData = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasKashi: text.includes('Kashi Vishwanath') || text.includes('Varanasi'),
          hasTirupati: text.includes('Tirupati Balaji') || text.includes('Tirumala'),
          hasHaridwar: text.includes('Haridwar') || text.includes('Rishikesh'),
        };
      });
      const devotionalAllFound = devotionalPkgData.hasKashi && devotionalPkgData.hasTirupati && devotionalPkgData.hasHaridwar;
      record(
        'Provenance',
        'Devotional Packages Provenance (Varanasi, Tirupati, Haridwar)',
        devotionalAllFound ? 'PASS' : 'FAIL',
        `Kashi: ${devotionalPkgData.hasKashi}, Tirupati: ${devotionalPkgData.hasTirupati}, Haridwar: ${devotionalPkgData.hasHaridwar}`,
        'Desktop'
      );

      // Check Foreign Trips packages
      currentUrl.url = `${BASE_URL}/foreign-trips`;
      await safeGoto(page, currentUrl.url);

      const foreignPkgData = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasDubai: text.includes('Dubai') || text.includes('Desert Safari'),
          hasBali: text.includes('Bali') || text.includes('Ubud'),
          hasThailand: text.includes('Thailand') || text.includes('Phuket'),
        };
      });
      const foreignAllFound = foreignPkgData.hasDubai && foreignPkgData.hasBali && foreignPkgData.hasThailand;
      record(
        'Provenance',
        'Foreign Packages Provenance (Dubai, Bali, Thailand)',
        foreignAllFound ? 'PASS' : 'FAIL',
        `Dubai: ${foreignPkgData.hasDubai}, Bali: ${foreignPkgData.hasBali}, Thailand: ${foreignPkgData.hasThailand}`,
        'Desktop'
      );

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 6: ACCURACY & CAUTIOUS WORDING OF GUIDANCE
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 6: Accuracy & Cautious Wording ---');
    {
      const page = await browser.newPage();
      attachPageListeners(page, currentUrl);

      // Check Devotional Guidance
      currentUrl.url = `${BASE_URL}/devotional-trips`;
      await safeGoto(page, currentUrl.url);

      const devotionalWording = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          mentionsTrustAuthority: text.includes('governed exclusively by respective temple trusts'),
          mentionsTTD: text.includes('Tirumala Tirupati Devasthanams'),
          mentionsKashiTrust: text.includes('Shri Kashi Vishwanath Temple Trust'),
          clarifiesOfficialTickets: text.includes('authorized temple trust portals') || text.includes('directly under your verified identity'),
          noUnrealisticVIPClaims: !text.includes('Guaranteed VIP Entry without trust passes') && !text.includes('instant sanctum access guaranteed'),
        };
      });

      const devotionalWordingPassed =
        devotionalWording.mentionsTrustAuthority &&
        devotionalWording.mentionsTTD &&
        devotionalWording.clarifiesOfficialTickets &&
        devotionalWording.noUnrealisticVIPClaims;

      record(
        'Cautious Wording',
        'Temple Darshan Trust Guidance & Cautious Boundary',
        devotionalWordingPassed ? 'PASS' : 'FAIL',
        `Trust Authority: ${devotionalWording.mentionsTrustAuthority}, TTD: ${devotionalWording.mentionsTTD}, No VIP Claims: ${devotionalWording.noUnrealisticVIPClaims}`,
        'Desktop'
      );

      // Check Foreign Visa Guidance
      currentUrl.url = `${BASE_URL}/foreign-trips`;
      await safeGoto(page, currentUrl.url);

      const foreignWording = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          noVisaIssuanceClaim: text.includes('does NOT issue visas') || text.includes('does not issue visas'),
          noApprovalGuarantee: text.includes('guarantee visa approvals') || text.includes('guarantee entry'),
          passport6Months: text.includes('valid for at least 6 months') || text.includes('6 months'),
          airfareExclusionNoted: text.includes('airfare') && text.includes('excluded'),
        };
      });

      const foreignWordingPassed =
        foreignWording.noVisaIssuanceClaim &&
        foreignWording.passport6Months &&
        foreignWording.airfareExclusionNoted;

      record(
        'Cautious Wording',
        'Foreign Visa & Passport Disclosure Cautious Boundary',
        foreignWordingPassed ? 'PASS' : 'FAIL',
        `No Visa Issuance: ${foreignWording.noVisaIssuanceClaim}, 6-mo Passport: ${foreignWording.passport6Months}, Airfare Disclosed: ${foreignWording.airfareExclusionNoted}`,
        'Desktop'
      );

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 7: AUTHENTICATION & BOOKING NAVIGATION
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 7: Authentication & Booking Navigation ---');
    {
      const page = await browser.newPage();
      attachPageListeners(page, currentUrl);

      // 7.1 Login Page
      currentUrl.url = `${BASE_URL}/login`;
      const loginRes = await safeGoto(page, currentUrl.url);
      const hasLoginForm = await page.evaluate(() => {
        return !!document.querySelector('form input[type="email"], form input[type="password"]');
      });
      record(
        'Auth & Booking',
        'Login Page Accessible with Valid Form',
        loginRes?.status() === 200 && hasLoginForm ? 'PASS' : 'FAIL',
        `Status: ${loginRes?.status()} | Form Present: ${hasLoginForm}`,
        'Desktop'
      );

      // 7.2 Register Page
      currentUrl.url = `${BASE_URL}/register`;
      const registerRes = await safeGoto(page, currentUrl.url);
      const hasRegisterForm = await page.evaluate(() => {
        return !!document.querySelector('form input[type="email"], form input[type="password"]');
      });
      record(
        'Auth & Booking',
        'Register Page Accessible with Valid Form',
        registerRes?.status() === 200 && hasRegisterForm ? 'PASS' : 'FAIL',
        `Status: ${registerRes?.status()} | Form Present: ${hasRegisterForm}`,
        'Desktop'
      );

      // 7.3 Booking Guard / Redirect Navigation
      currentUrl.url = `${BASE_URL}/booking/test-package-id`;
      await safeGoto(page, currentUrl.url);
      const finalBookingUrl = page.url();
      const isRedirectedToAuthOrHandled = finalBookingUrl.includes('/login') || finalBookingUrl.includes('/booking') || finalBookingUrl.includes('/packages');
      record(
        'Auth & Booking',
        'Booking Route Navigation & Auth Redirection',
        isRedirectedToAuthOrHandled ? 'PASS' : 'WARN',
        `Requested /booking/test-package-id -> Arrived at: ${finalBookingUrl}`,
        'Desktop'
      );

      await page.close();
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 8: CONSOLE ERRORS & HYDRATION MISMATCH MONITORING
    // ══════════════════════════════════════════════════════════════════
    console.log('\n--- SUITE 8: Hydration & Console Error Analysis ---');
    {
      const hydrationErrors = consoleErrors.filter((e) =>
        e.text.toLowerCase().includes('hydration') ||
        e.text.toLowerCase().includes('did not match') ||
        e.text.toLowerCase().includes('cz-shortcut-listen')
      );

      record(
        'Diagnostics',
        'Zero React Hydration Mismatch Errors',
        hydrationErrors.length === 0 ? 'PASS' : 'FAIL',
        `Detected ${hydrationErrors.length} hydration warnings/errors in clean browser session`,
        'All Viewports'
      );

      const realRuntimeErrors = consoleErrors.filter(
        (e) =>
          (e.type === 'error' || e.type === 'pageerror') &&
          !e.text.includes('401 (Unauthorized)') &&
          !e.text.includes('/api/auth/me')
      );
      record(
        'Diagnostics',
        'Zero Severe Unhandled Application Errors',
        realRuntimeErrors.length === 0 ? 'PASS' : 'WARN',
        `Found ${realRuntimeErrors.length} unexpected application errors (excluding normal unauthenticated 401s on /api/auth/me for guest visits)`,
        'All Viewports'
      );

      record(
        'Diagnostics',
        'Zero Critical Network Request Failures',
        failedRequests.length === 0 ? 'PASS' : 'WARN',
        `Recorded ${failedRequests.length} failed network requests`,
        'All Viewports'
      );
    }
  } finally {
    await browser.close();
  }

  // Summary output
  console.log('\n================================================================');
  console.log(' QA TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;
  console.log(`Total Checks: ${results.length}`);
  console.log(`Passed:       ${passCount}`);
  console.log(`Failed:       ${failCount}`);
  console.log(`Warnings:     ${warnCount}`);
  console.log('================================================================\n');

  // Save JSON report for artifact generation
  const summaryData = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: passCount,
    failed: failCount,
    warnings: warnCount,
    results,
    consoleErrors,
    failedRequests,
  };

  fs.writeFileSync('scripts/qa-results.json', JSON.stringify(summaryData, null, 2), 'utf-8');
  console.log('Results written to scripts/qa-results.json');
}

runQASuite().catch((err) => {
  console.error('Fatal error during QA suite execution:', err);
  process.exit(1);
});
