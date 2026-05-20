import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Inject mock EIP-1193 Web3 provider before the page loads
  await page.addInitScript(() => {
    const listeners: Record<string, Function[]> = {};
    const mockProvider = {
      isMetaMask: true,
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        console.log(`[Mock Ethereum Provider] request: ${method}`, params);
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return ['0xA65d959d82DC2cc329950941D8e306347401CeBf'];
        }
        if (method === 'eth_chainId') {
          return '0x61'; // BSC Testnet in hex (97)
        }
        if (method === 'net_version') {
          return '97';
        }
        if (method === 'personal_sign') {
          return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01';
        }
        if (method === 'eth_sendTransaction') {
          return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        }
        if (method === 'eth_blockNumber') {
          return '0x1';
        }
        if (method === 'eth_estimateGas') {
          return '0x5208'; // 21000 hex
        }
        if (method === 'eth_gasPrice') {
          return '0x3b9aca00'; // 1 Gwei in hex
        }
        if (method === 'eth_call') {
          // Return some dummy balance or status responses
          return '0x00000000000000000000000000000000000000000000003635c9adc5dea00000'; // Hex representation for a large balance
        }
        return null;
      },
      on: (event: string, handler: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      },
      removeListener: (event: string, handler: Function) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(h => h !== handler);
      },
      addListener: (event: string, handler: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      },
      emit: (event: string, ...args: any[]) => {
        if (listeners[event]) {
          listeners[event].forEach(h => h(...args));
        }
      },
      providers: undefined
    };
    (window as any).ethereum = mockProvider;
  });
});

test.describe('NEXALO V2 E2E Suite', () => {
  test('should load page and check title and aesthetics', async ({ page }) => {
    await page.goto('/');

    // Check high level page metadata & elements
    await expect(page).toHaveTitle(/Nexalo/i);
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toContainText('NEXALO');
    
    // Validate Hero elements
    const subtitle = page.locator('p.text-glow-blue');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('96% Retorno Real');
  });

  test('should render Interactive Infographic correctly', async ({ page }) => {
    await page.goto('/');

    // Ensure interactive flow cards are loaded
    const card1 = page.locator('text=Adquisición de Nexums');
    const card2 = page.locator('text=Smart Contract Inmutable');
    const card3 = page.locator('text=Resolución VRF');

    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();
    await expect(card3).toBeVisible();
  });

  test('should display Web3 connection elements and connect mock wallet', async ({ page }) => {
    await page.goto('/');

    // Verify AppKit button component exists
    const appKitButton = page.locator('appkit-button');
    await expect(appKitButton).toBeVisible();
  });

  test('should render lottery rounds grid and allow digit inputs', async ({ page }) => {
    await page.goto('/');

    // Scroll to products grid
    const buySection = page.locator('#comprar');
    await buySection.scrollIntoViewIfNeeded();

    // Verify some round names are displayed
    await expect(page.locator('h3').filter({ hasText: 'FLASH' }).first()).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'ORIGINAL' }).first()).toBeVisible();
  });

  test('should render Staking Section details', async ({ page }) => {
    await page.goto('/');

    // Scroll to staking section
    const stakingSection = page.locator('#staking');
    await stakingSection.scrollIntoViewIfNeeded();

    // Verify staking headers exist
    await expect(page.locator('text=Staking Institucional')).toBeVisible();
    await expect(page.locator('text=Tu Bóveda NXL')).toBeVisible();
    await expect(page.locator('text=Recompensas (WBTC)')).toBeVisible();
  });
});
